import nameWithoutNS from './nameWithoutNS'

/*
  ElementNodes have attributes and children.
*/
export default
class XMLNodeConverter {

  constructor(type) {
    this.type = type
    this.tagName = nameWithoutNS(type)
    this.tagNameNS = type
  }

  matchElement(el) {
    return el.is(this.tagName)
  }

  export(node, el, converter) {
    el.setAttributes(node.attributes)
  }

}
