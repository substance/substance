import { cssSelect, domSerializer, DomUtils, ElementType } from './vendor'
import parseMarkup from './parseMarkup'
import DOMEventListener from './DOMEventListener'

class XNode {

  constructor(type, args) {
    this.type = type
    if (!type) throw new Error("'type' is mandatory")

    if (args.ownerDocument) this.ownerDocument = args.ownerDocument

    let self = this
    switch(type) {
      case ElementType.Tag: {
        this.name = args.name
        this.attribs = {
          get class() {
            return stringifyClasses(self.classes)
          },
          set class(classNames) {
            self.classes = parseClasses(classNames)
          },
          get style() {
            return stringifyStyles(self.styles)
          },
          set style(style) {
            self.styles = parseStyles(style)
          }
        }
        this.classes = new Set()
        this.styles = new Map()
        this.props = {}
        if (args.props) {
          Object.assign(this.props, args.props)
        }
        this.eventListeners = []
        this.children = []
        if (args.attribs) {
          Object.assign(this.attribs, args.attribs)
        }
        break
      }
      case ElementType.Text:
      case ElementType.Comment: {
        this.data = args.data || ''
        break
      }
      case ElementType.CDATA: {
        this.children = args.children || []
        break
      }
      case ElementType.Directive: {
        this.name = args.name
        this.data = args.data
        break
      }
      case 'document': {
        this.format = args.format
        break
      }
      default:
        //
    }
  }

  clone(deep) {
    let clone = new XNode(this.type, this)
    if (deep && this.children) {
      this.children.forEach((child) => {
        clone.appendChild(child.clone(deep))
      })
    }
    return clone
  }

  getAttribute(name) {
    if (this.attribs) {
      return this.attribs[name]
    }
  }

  setAttribute(name, value) {
    if (this.attribs) {
      this.attribs[name] = value
    }
  }

  removeAttribute(name) {
    if (this.attribs) {
      delete this.attribs[name]
    }
  }

  getProperty(name) {
    if (this.props) {
      return this.props[name]
    }
  }

  setProperty(name, value) {
    if (this.props) {
      this.props[name] = value
    }
  }

  removeProperty(name) {
    if (this.props && this.props.hasOwnProperty(name)) {
      delete this.props[name]
    }
  }

  hasClass(name) {
    if (this.classes) {
      return this.classes.has(name)
    }
  }

  addClass(name) {
    if (this.classes) {
      this.classes.add(name)
    }
  }

  removeClass(name) {
    if (this.classes) {
      this.classes.delete(name)
    }
  }

  getInnerHTML() {
    return DomUtils.getInnerHTML(this)
  }

  // TODO: parse html using settings from el,
  // clear old children and append new children
  setInnerHTML(html) {
    if (this.children) {
      let children = parseMarkup(html, {
        ownerDocument: this.ownerDocument
      })
      this.removeAllChildren()
      children.forEach((child) => {
        this.appendChild(child)
      })
    }
  }

  getOuterHTML() {
    return domSerializer(this)
  }

  getTextContent() {
    return DomUtils.getText(this)
  }

  setTextContent(text) {
    if (this.type === 'text') {
      this.data = text
    } else if (this.children) {
      let child = XNode.createTextNode(text, this.ownerDocument)
      this.removeAllChildren()
      this.appendChild(child)
    }
  }

  getValue() {
    return this.data
  }

  setValue(value) {
    this.data = value
  }

  getStyle(name) {
    if (this.styles) {
      return this.styles[name]
    }
  }

  setStyle(name, value) {
    if (this.styles) {
      this.styles[name] = value
    }
  }

  is(cssSelector) {
    return cssSelect.is(this, cssSelector)
  }

  find(cssSelector) {
    return cssSelect.selectOne(cssSelector, this)
  }

  findAll(cssSelector) {
    return cssSelect.selectAll(cssSelector, this)
  }

  appendChild(child) {
    DomUtils.appendChild(this, child)
  }

  insertAt(pos, child) {
    let children = this.children
    if (children) {
      // NOTE: manipulating htmlparser's internal children array
      if (pos >= children.length) {
        this.appendChild(child)
      } else {
        DomUtils.append(children[pos], child)
      }
    }
  }

  removeAt(pos) {
    let children = this.children
    if (children) {
      let child = children[pos]
      child.remove()
    }
  }

  removeAllChildren() {
    let children = this.children
    if (children) {
      children.forEach((child) => {
        child.next = child.prev = child.parent = null
      })
      children.length = 0
    }
  }

  remove() {
    DomUtils.removeElement(this)
  }

  replaceWith(newEl) {
    DomUtils.replaceElement(this, newEl)
  }

  addEventListener(eventName, handler, options) {
    var listener
    if (arguments.length === 1 && arguments[0]._isDOMEventListener) {
      listener = arguments[0]
    } else {
      options = options || {}
      options.context = options.context || this._owner._comp
      listener = new DOMEventListener(eventName, handler, options)
    }
    if (!this.eventListeners) {
      this.eventListeners = []
    }
    this.eventListeners.push(listener)
    return this
  }

  removeEventListener(eventName, handler) {
    if (this.eventListeners) {
      DOMEventListener.findIndex(this.eventListeners, eventName, handler)
    }
    return this
  }

  getEventListeners() {
    return this.eventListeners
  }

}

XNode.createTextNode = function(text, ownerDocument) {
  return new XNode(ElementType.Text, {
    data: text,
    ownerDocument: ownerDocument
  })
}

XNode.createElement = function(tagName, ownerDocument) {
  return new XNode(ElementType.Tag, {
    name: tagName,
    ownerDocument: ownerDocument
  })
}

function parseClasses(classNames) {
  return new Set(classNames.split(/\s+/))
}

function stringifyClasses(classes) {
  return Array.from(classes).join(' ')
}

function parseStyles(styles) {
  styles = (styles || '').trim()
  if (!styles) return {}
  return styles
    .split(';')
    .reduce(function(obj, str){
      var n = str.indexOf(':')
      // skip if there is no :, or if it is the first/last character
      if (n < 1 || n === str.length-1) return obj
      obj[str.slice(0,n).trim()] = str.slice(n+1).trim()
      return obj
    }, new Map())
}

function stringifyStyles(styles) {
  if (!styles) return ''
  let str = Object.keys(styles).map((name) => {
    return name + ':' + styles[name]
  }).join(';')
  if (str.length > 0) str += ';'
  return str
}

export default XNode