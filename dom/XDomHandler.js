import { ElementType } from './vendor'
import XNode from './XNode'

const re_whitespace = /\s+/g

/*
  Customized implementation of [DomHandler](https://github.com/fb55/domhandler).
*/
class XDomHandler {

  constructor() {
    this._options = {}

    this.dom = []
    this._done = false
    this._tagStack = []

    this._parser = null
    this._doc = null
  }

  // called directly after construction of Parser and at the end of Parser.reset()
  onparserinit(parser){
    this._parser = parser
    this.dom = []
    this._done = false
    this._tagStack = []
    this._doc = new XNode('document', {
      format: parser._options.xmlMode ? 'xml' : 'html'
    })
  }

  //Signals the handler that parsing is done
  onend(){
    if(this._done) return
    this._done = true
    this._parser = null
  }

  onerror(error) {
    throw error
  }

  onclosetag() {
    this._tagStack.pop()
  }

  _addDomElement(element) {
    let siblings = null
    let parent = null
    if (this._tagStack.length > 0) {
      parent = this._tagStack[this._tagStack.length - 1]
      if (!parent.children) parent.children = []
      siblings = parent.children
    } else {
      siblings = this.dom
    }
    let previousSibling = siblings[siblings.length - 1]
    // set up next/previous link
    element.next = null
    if(previousSibling){
      element.prev = previousSibling
      previousSibling.next = element
    } else {
      element.prev = null
    }
    // either push the element to the current open tag's children, or keep a reference as top-level element
    siblings.push(element)
    element.parent = parent || null
  }

  onopentag(name, attribs) {
    let element = new XNode(ElementType.Tag, { name: name, attribs: attribs, ownerDocument: this._doc })
    this._addDomElement(element)
    this._tagStack.push(element)
  }

  ontext(text) {
    if (this._options.normalizeWhitespace) {
      text = text.replace(re_whitespace, " ")
    }
    let lastTag
    if (this._tagStack.length > 0) {
      let _top = this._tagStack[this._tagStack.length - 1]
      if (_top && _top.children) lastTag = _top.children[_top.children.length - 1]
    } else {
      lastTag = this.dom[this.dom.length-1]
    }
    if (lastTag && lastTag.type === ElementType.Text) {
      lastTag.data += text
    } else {
      let element = new XNode(ElementType.Text, { data: text, ownerDocument: this._doc })
      this._addDomElement(element)
    }
  }

  oncomment(data) {
    var lastTag = this._tagStack[this._tagStack.length - 1]
    if(lastTag && lastTag.type === ElementType.Comment){
      lastTag.data += data
    } else {
      let element = new XNode(ElementType.Comment, { data: data, ownerDocument: this._doc })
      this._addDomElement(element)
      this._tagStack.push(element)
    }
  }

  oncommentend() {
    this._tagStack.pop()
  }

  oncdatastart() {
    let element = new XNode(ElementType.CDATA, {
      children: [ new XNode(ElementType.Text, { data: "", ownerDocument: this._doc }) ],
      ownerDocument: this._doc
    })
    this._addDomElement(element)
    this._tagStack.push(element)
  }

  oncdataend() {
    this._tagStack.pop()
  }

  onprocessinginstruction(name, data) {
    let element = new XNode(ElementType.Directive, {
      name: name,
      data: data,
      ownerDocument: this._doc
    })
    this._addDomElement(element)
  }

}

export default XDomHandler