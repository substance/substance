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
    return (el.tagName === this.tagNameNS)
  }

  export(node, el) {
    el.tagName = this.tagNameNS
    el.setAttributes(node.attributes)
  }

}
