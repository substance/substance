import { ElementType } from './vendor'
import XNode from './XNode'
import forEach from '../util/forEach'

const re_whitespace = /\s+/g

/*
  Customized implementation of [DomHandler](https://github.com/fb55/domhandler).
*/
class XDomHandler {

  constructor(options = {}) {
    this.options = options
    this.document = null
    this._tagStack = []
  }

  // called directly after construction of Parser and at the end of Parser.reset()
  onparserinit(){
    this.document = new XNode('document', { format: this.options.format })
    this._tagStack = [this.document]
  }

  onend(){}

  onerror(error) {
    throw error
  }

  onclosetag() {
    this._tagStack.pop()
  }

  _addDomElement(element) {
    let parent = this._tagStack[this._tagStack.length - 1]
    if (!parent.childNodes) parent.childNodes = []
    let siblings = parent.childNodes

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

  onopentag(name, attributes) {
    let element = this.document.createElement(name)
    forEach(attributes, (val, key) => {
      element.setAttribute(key, val)
    })
    this._addDomElement(element)
    this._tagStack.push(element)
  }

  ontext(text) {
    if (this.options.normalizeWhitespace) {
      text = text.replace(re_whitespace, " ")
    }
    let lastTag
    let _top = this._tagStack[this._tagStack.length - 1]
    if (_top && _top.childNodes) lastTag = _top.childNodes[_top.childNodes.length - 1]
    if (lastTag && lastTag.type === ElementType.Text) {
      lastTag.data += text
    } else {
      let element = this.document.createTextNode(text)
      this._addDomElement(element)
    }
  }

  oncomment(data) {
    var lastTag = this._tagStack[this._tagStack.length - 1]
    if(lastTag && lastTag.type === ElementType.Comment){
      lastTag.data += data
    } else {
      let element = this.document.createComment(data)
      this._addDomElement(element)
      this._tagStack.push(element)
    }
  }

  oncommentend() {
    this._tagStack.pop()
  }

  oncdatastart(data) {
    let element = this.document.createCDATASection(data)
    this._addDomElement(element)
    this._tagStack.push(element)
  }

  oncdataend() {
    this._tagStack.pop()
  }

  onprocessinginstruction(name, data) {
    let element = this.document.createProcessingInstruction(name, data)
    this._addDomElement(element)
  }

}

export default XDomHandler