import map from '../util/map'
import DomUtils from '../vendor/domutils'
import nameWithoutNS from './nameWithoutNS'

class Adapter extends DomUtils.DomUtils {
  // we only have nodes which correspond to DOM elements
  isTag () {
    return true
  }

  getChildren (elem) {
    if (elem.getChildren) {
      return elem.getChildren()
    } else {
      return []
    }
  }

  getAttributeValue (elem, name) {
    if (elem.getAttribute) {
      return elem.getAttribute(name)
    }
  }

  getAttributes (elem) {
    if (elem.hasOwnProperty('attributes')) {
      return ['id', elem.id].concat(map(elem.attributes, (val, key) => { return [key, val] }))
    } else {
      return ['id', elem.id]
    }
  }

  hasAttrib (elem, name) {
    if (name === 'id') {
      return true
    } else if (elem.hasOwnProperty('attributes')) {
      return elem.attributes.hasOwnProperty(name)
    } else {
      return false
    }
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

const cssSelectAdapter = new Adapter()

export default cssSelectAdapter
