import DomUtils from '../vendor/domutils'
import { getChildren, getParent } from './documentHelpers'

export default class DocumentNodeSelectAdapter extends DomUtils.DomUtils {
  // we only have nodes which correspond to DOM elements
  isTag () {
    return true
  }

  getChildren (node) {
    return getChildren(node)
  }

  getParent (node) {
    return getParent(node)
  }

  getAttributeValue (node, name) {
    return node[name]
  }

  getAttributes (node) {
    // TODO: how could be attribute selectors be implemented?
    // Probably only properties with primitive type
    return ['id', node.id]
  }

  hasAttrib (node, name) {
    if (name === 'id') {
      return true
    } else {
      return node.hasOwnProperty(name)
    }
  }

  getName (node) {
    return node.type
  }

  getNameWithoutNS (node) {
    return this.getName(node)
  }

  getText (node) {
    // TODO: do we really need this. Assuming that it is not important for css-select
    if (node.isText()) {
      return node.getText()
    }
    return ''
  }
}
