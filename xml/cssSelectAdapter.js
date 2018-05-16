import map from '../util/map'
import DomUtils from '../vendor/domutils'
import nameWithoutNS from './nameWithoutNS'

class Adapter extends DomUtils.DomUtils {
  // we only have nodes which correspond to DOM elements
  isTag () {
    return true
  }

  getChildren (elem) {
    return elem.getChildren() || []
  }

  getAttributeValue (elem, name) {
    return elem.getAttribute(name)
  }

  getAttributes (elem) {
    return ['id', elem.id].concat(map(elem.attributes, (val, key) => { return [key, val] }))
  }

  hasAttrib (elem, name) {
    return name === 'id' || elem.attributes.hasOwnProperty(name)
  }

  getName (elem) {
    return elem.type
  }

  getNameWithoutNS (elem) {
    return nameWithoutNS(this.getName(elem))
  }

  getText (elem) {
    if (elem._elementType === 'text') {
      return elem.getText()
    }
    // TODO: do we really need this. Assuming that it is not important for css-select
    return ''
  }
}

export default new Adapter()
