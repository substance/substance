import isArray from '../util/isArray'

/*
  Maintains links to the parent node, but only for children of ElementNodes.
*/
export default class XMLParentNodeHook {
  constructor (doc) {
    this.doc = doc
    // parents by id of child nodes
    this.parents = {}
    doc.data.on('operation:applied', this._onOperationApplied, this)
  }

  _onOperationApplied (op) {
    const doc = this.doc
    const parents = this.parents
    let node = doc.get(op.path[0])
    switch (op.type) {
      case 'create': {
        if (node._childNodes) {
          _setParent(node, node._childNodes)
        }
        _setRegisteredParent(node)
        break
      }
      case 'update': {
        // ATTENTION: we only set parents but don't remove when they are deleted
        // assuming that if the parent gets deleted, the children get deleted too
        let update = op.diff
        if (op.path[1] === '_childNodes') {
          if (update.isInsert()) {
            _setParent(node, update.getValue())
          } else if (update.isDelete()) {
            _setParent(null, update.getValue())
          }
        }
        break
      }
      case 'set': {
        if (op.path[1] === '_childNodes') {
          _setParent(null, op.getOldValue())
          _setParent(node, op.getValue())
        }
        break
      }
      default:
        //
    }

    function _setParent (parent, ids) {
      if (ids) {
        if (isArray(ids)) {
          ids.forEach(_set)
        } else {
          _set(ids)
        }
      }
      function _set (id) {
        // Note: it can happen, e.g. during deserialization, that the child node
        // is created later than the parent node
        // so we store the parent for later
        parents[id] = parent
        let child = doc.get(id)
        if (child) {
          child.parentNode = parent
        }
      }
    }
    function _setRegisteredParent (child) {
      let parent = parents[child.id]
      if (parent) {
        child.parentNode = parent
      }
    }
  }

  static register (doc) {
    return new XMLParentNodeHook(doc)
  }
}
