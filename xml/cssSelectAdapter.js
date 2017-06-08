import { DomUtils, map } from '../util'
import nameWithoutNS from './nameWithoutNS'

class Adapter extends DomUtils.DomUtils {

  // we only have nodes which correspond to DOM elements
  isTag() {
    return true
  }

  getChildren(elem){
    if (elem.getChildren) {
      return elem.getChildren()
    } else {
      return []
    }
  }

  getAttributeValue(elem, name){
    return elem.attributes[name]
  }

  getAttributes(elem) {
    return map(elem.attributes, (val, key) => { return [key,val] })
  }

  hasAttrib(elem, name){
    return elem.attributes.hasOwnProperty(name)
  }

  getName(elem){
    return elem.type
  }

  getNameWithoutNS(elem){
    return nameWithoutNS(this.getName(elem))
  }

  getText(elem) {
    if (elem._elementType === 'text') {
      return elem.getText()
    }
    // TODO: do we really need this. Assuming that it is not important for css-select
    return ''
  }
}

export default new Adapter()
