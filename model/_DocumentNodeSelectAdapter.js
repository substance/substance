import forEach from '../util/forEach'
import DomUtils from '../vendor/domutils'

export default class DocumentNodeSelectAdapter extends DomUtils.DomUtils {
  // we only have nodes which correspond to DOM elements
  isTag () {
    return true
  }

  getChildren (node) {
    const doc = node.getDocument()
    const id = node.id
    const schema = node.getSchema()
    let result = []
    for (let p of schema) {
      const name = p.name
      if (p.isText()) {
        let annos = doc.getAnnotations([id, name])
        forEach(annos, a => result.push(a))
      } else if (p.isReference() && p.isOwned()) {
        let val = this[name]
        if (val) {
          if (p.isArray()) {
            result = result.concat(val.map(id => doc.get(id)))
          } else {
            result.push(doc.get(val))
          }
        }
      }
    }
    return result
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
