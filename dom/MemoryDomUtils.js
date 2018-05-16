import ElementType from 'domelementtype'

/*
  EXPERIMENTAL:

  We found out that using the encoder from `entities` module
  is doing too much

  Instead we do a simpler version now, encoding just a small
  set:
  - in attributes we only need to escape '"'
  - in textContent we need to escape '<' and '&'

  TODO: this is copy and pasted from the bundled entities vendor file
*/
// import entities from 'entities';

const _encodeXMLContent = ((obj) => {
  let invObj = getInverseObj(obj)
  let replacer = getInverseReplacer(invObj)
  return getInverse(invObj, replacer)
})({
  amp: '&',
  gt: '>',
  lt: '<'
})

const _encodeXMLAttr = ((obj) => {
  let invObj = getInverseObj(obj)
  let replacer = getInverseReplacer(invObj)
  return getInverse(invObj, replacer)
})({
  quot: '"'
})

function getInverseObj (obj) {
  return Object.keys(obj).sort().reduce(function (inverse, name) {
    inverse[obj[name]] = '&' + name + ';'
    return inverse
  }, {})
}

function getInverseReplacer (inverse) {
  var single = [],
    multiple = []

  Object.keys(inverse).forEach(function (k) {
    if (k.length === 1) {
      single.push('\\' + k)
    } else {
      multiple.push(k)
    }
  })

  multiple.unshift('[' + single.join('') + ']')

  return new RegExp(multiple.join('|'), 'g')
}

var re_nonASCII = /[^\0-\x7F]/g
var re_astralSymbols = /[\uD800-\uDBFF][\uDC00-\uDFFF]/g

function singleCharReplacer (c) {
  return '&#x' + c.charCodeAt(0).toString(16).toUpperCase() + ';'
}

function astralReplacer (c) {
  var high = c.charCodeAt(0)
  var low = c.charCodeAt(1)
  var codePoint = (high - 0xD800) * 0x400 + low - 0xDC00 + 0x10000
  return '&#x' + codePoint.toString(16).toUpperCase() + ';'
}

function getInverse (inverse, re) {
  function func (name) {
    return inverse[name]
  }
  return function (data) {
    return data
      .replace(re, func)
      .replace(re_astralSymbols, astralReplacer)
      .replace(re_nonASCII, singleCharReplacer)
  }
}

const booleanAttributes = {
  __proto__: null,
  allowfullscreen: true,
  async: true,
  autofocus: true,
  autoplay: true,
  checked: true,
  controls: true,
  default: true,
  defer: true,
  disabled: true,
  hidden: true,
  ismap: true,
  loop: true,
  multiple: true,
  muted: true,
  open: true,
  readonly: true,
  required: true,
  reversed: true,
  scoped: true,
  seamless: true,
  selected: true,
  typemustmatch: true
}

const unencodedElements = {
  __proto__: null,
  style: true,
  script: true,
  xmp: true,
  iframe: true,
  noembed: true,
  noframes: true,
  plaintext: true,
  noscript: true
}

const singleTag = {
  __proto__: null,
  area: true,
  base: true,
  basefont: true,
  br: true,
  col: true,
  command: true,
  embed: true,
  frame: true,
  hr: true,
  img: true,
  input: true,
  isindex: true,
  keygen: true,
  link: true,
  meta: true,
  param: true,
  source: true,
  track: true,
  wbr: true
}

export default class DomUtils {
  isTag (elem) {
    return ElementType.isTag(elem)
  }

  removeElement (elem) {
    if (elem.prev) elem.prev.next = elem.next
    if (elem.next) elem.next.prev = elem.prev
    if (elem.parent) {
      var childs = elem.parent.childNodes
      let pos = childs.lastIndexOf(elem)
      if (pos < 0) throw new Error('Invalid state')
      childs.splice(pos, 1)
      elem.parent = null
    }
  }

  replaceElement (elem, replacement) {
    if (replacement.parent) this.removeElement(replacement)
    var prev = replacement.prev = elem.prev
    if (prev) {
      prev.next = replacement
    }

    var next = replacement.next = elem.next
    if (next) {
      next.prev = replacement
    }

    var parent = replacement.parent = elem.parent
    if (parent) {
      var childs = parent.childNodes
      let pos = childs.lastIndexOf(elem)
      if (pos < 0) throw new Error('Invalid state')
      childs[pos] = replacement
    }
  }

  appendChild (elem, child) {
    if (child.parent) this.removeElement(child)
    child.parent = elem

    if (elem.childNodes.push(child) !== 1) {
      var sibling = elem.childNodes[elem.childNodes.length - 2]
      sibling.next = child
      child.prev = sibling
      child.next = null
    }
  }

  append (elem, next) {
    if (next.parent) this.removeElement(next)
    var parent = elem.parent,
      currNext = elem.next

    next.next = currNext
    next.prev = elem
    elem.next = next
    next.parent = parent

    if (currNext) {
      currNext.prev = next
      if (parent) {
        var childs = parent.childNodes
        let pos = childs.lastIndexOf(currNext)
        if (pos < 0) throw new Error('Invalid state')
        childs.splice(pos, 0, next)
      }
    } else if (parent) {
      parent.childNodes.push(next)
    }
  }

  prepend (elem, prev) {
    if (prev.parent) this.removeElement(prev)
    var parent = elem.parent
    if (parent) {
      var childs = parent.childNodes
      let pos = childs.lastIndexOf(elem)
      if (pos < 0) throw new Error('Invalid state')
      childs.splice(pos, 0, prev)
    }

    if (elem.prev) {
      elem.prev.next = prev
    }

    prev.parent = parent
    prev.prev = elem.prev
    prev.next = elem
    elem.prev = prev
  }

  filter (test, element, recurse, limit) {
    if (!Array.isArray(element)) element = [element]

    if (typeof limit !== 'number' || !isFinite(limit)) {
      limit = Infinity
    }
    return this.find(test, element, recurse !== false, limit)
  }

  find (test, elems, recurse, limit) {
    var result = [], childs

    for (var i = 0, j = elems.length; i < j; i++) {
      if (test(elems[i])) {
        result.push(elems[i])
        if (--limit <= 0) break
      }

      childs = this.getChildren(elems[i])
      if (recurse && childs && childs.length > 0) {
        childs = this.find(test, childs, recurse, limit)
        result = result.concat(childs)
        limit -= childs.length
        if (limit <= 0) break
      }
    }

    return result
  }

  findOneChild (test, elems) {
    for (var i = 0, l = elems.length; i < l; i++) {
      if (test(elems[i])) return elems[i]
    }

    return null
  }

  findOne (test, elems) {
    var elem = null

    for (var i = 0, l = elems.length; i < l && !elem; i++) {
      const child = elems[i]
      if (!this.isTag(child)) {
        continue
      } else if (test(child)) {
        elem = child
      } else {
        const childNodes = this.getChildren(child)
        if (childNodes.length > 0) {
          elem = this.findOne(test, childNodes)
        }
      }
    }

    return elem
  }

  existsOne (test, elems) {
    for (var i = 0, l = elems.length; i < l; i++) {
      const elem = elems[i]
      // test only elements
      if (!this.isTag(elem)) continue
      // found if the element itself matches
      if (test(elem)) return true
      // otherwise, if one of its children matches
      const childNodes = this.getChildren(elem)
      if (childNodes.length > 0 && this.existsOne(test, childNodes)) return true
    }
    return false
  }

  findAll (test, elems) {
    var result = []
    for (var i = 0, j = elems.length; i < j; i++) {
      const elem = elems[i]
      if (!this.isTag(elem)) continue
      if (test(elem)) result.push(elem)
      const childNodes = this.getChildren(elem)
      if (childNodes.length > 0) {
        result = result.concat(this.findAll(test, childNodes))
      }
    }
    return result
  }

  getAttributes (el) {
    let attribs = el.getAttributes()
    // HACK: this is a bit confusing, because MemoryDOMElement and BrowserDOMElement are
    // not 100% compatible yet regarding getAttributes()
    if (attribs instanceof Map) {
      return Array.from(attribs)
    } else if (attribs && attribs.forEach) {
      let res = []
      attribs.forEach((val, key) => {
        res.push([key, val])
      })
      return res
    } else {
      return []
    }
  }

  formatAttribs (el, opts = {}) {
    let output = []
    const attributes = this.getAttributes(el)
    attributes.forEach(([key, value]) => {
      if (!value && booleanAttributes[key]) {
        output.push(key)
      } else {
        output.push(key + '="' + (opts.decodeEntities ? _encodeXMLAttr(value) : value) + '"')
      }
    })
    return output.join(' ')
  }

  render (dom, opts) {
    if (!Array.isArray(dom)) dom = [dom]
    opts = opts || {}
    let output = []
    for (var i = 0; i < dom.length; i++) {
      let elem = dom[i]
      switch (elem.type) {
        case 'root':
        case 'document': {
          output.push(this.render(this.getChildren(elem), opts))
          break
        }
        case ElementType.Tag:
        case ElementType.Script:
        case ElementType.Style: {
          output.push(this.renderTag(elem, opts))
          break
        }
        case ElementType.CDATA: {
          output.push(this.renderCdata(elem))
          break
        }
        case ElementType.Comment: {
          output.push(this.renderComment(elem))
          break
        }
        case ElementType.Directive: {
          output.push(this.renderDirective(elem))
          break
        }
        case ElementType.Doctype: {
          output.push(this.renderDoctype(elem))
          break
        }
        case ElementType.Text: {
          output.push(this.renderText(elem, opts))
          break
        }
        default:
          throw new Error('Not implement yet: render of element type ' + elem.type)
      }
    }
    return output.join('')
  }

  renderTag (elem, opts) {
    const name = this.getName(elem)
    if (name === 'svg') opts = {decodeEntities: opts.decodeEntities, xmlMode: true}
    let tag = '<' + name
    let attribs = this.formatAttribs(elem, opts)
    if (attribs) {
      tag += ' ' + attribs
    }
    const childNodes = this.getChildren(elem)
    if (opts.xmlMode && childNodes.length === 0) {
      tag += '/>'
    } else {
      tag += '>'
      if (childNodes.length > 0) {
        tag += this.render(childNodes, opts)
      }
      if (!singleTag[name] || opts.xmlMode) {
        tag += '</' + name + '>'
      }
    }
    return tag
  }

  renderDirective (elem) {
    return '<?' + this.getData(elem) + '?>'
  }

  renderDoctype (elem) {
    const { name, publicId, systemId } = this.getData(elem)
    let frags = ['DOCTYPE', name]
    if (publicId) {
      frags.push('PUBLIC')
      frags.push('"' + publicId + '"')
      if (systemId) frags.push('"' + systemId + '"')
    }
    return '<!' + frags.join(' ') + '>'
  }

  renderText (elem, opts) {
    let text = this.getText(elem)
    if (opts.decodeEntities) {
      const parent = this.getParent(elem)
      if (!(parent && this.getName(parent) in unencodedElements)) {
        text = _encodeXMLContent(text)
      }
    }
    return text
  }

  renderCdata (elem) {
    return '<![CDATA[' + this.getData(elem) + ']]>'
  }

  renderComment (elem) {
    return '<!--' + this.getData(elem) + '-->'
  }

  getInnerHTML (elem, opts) {
    const childNodes = this.getChildren(elem)
    return childNodes.map((child) => {
      return this.render(child, opts)
    }).join('')
  }

  getOuterHTML (elem, opts) {
    return this.render(elem, opts)
  }

  getData (elem) {
    return elem.data
  }

  getText (elem, sub) {
    if (Array.isArray(elem)) return elem.map(e => this.getText(e, sub)).join('')
    switch (elem.type) {
      case ElementType.Tag:
      case ElementType.Script:
      case ElementType.Style:
        return this.getText(this.getChildren(elem), true)
      case ElementType.Text:
      case ElementType.CDATA:
        return elem.data
      case ElementType.Comment:
        // comments are not rendered
        // into the textContent of parentNodes
        if (sub) {
          return ''
        }
        return elem.data
      default:
        return ''
    }
  }

  getChildren (elem) {
    return elem.childNodes
  }

  getParent (elem) {
    return elem.parent
  }

  getSiblings (elem) {
    var parent = this.getParent(elem)
    return parent ? this.getChildren(parent) : [elem]
  }

  getAttributeValue (elem, name) {
    return elem.getAttribute(name)
  }

  hasAttrib (elem, name) {
    return elem.hasAttribute(name)
  }

  getName (elem) {
    return elem.name
  }

  getNameWithoutNS (elem) {
    return elem.nameWithoutNS
  }
}
