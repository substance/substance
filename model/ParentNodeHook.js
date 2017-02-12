import isArray from '../util/isArray'

/*
  This is an experiment trying to have better support for data types with a hierarchical
  nature, such as Lists, Tables etc.

  Our data model is inherently flat, and does not have any special support for hierarchical data types.
  The flat data model is essential for a simple OT implementation. Hierarchy is achieved by storing ids
  to reference child nodes.

  After longer discussions we agreed that we are very happy with the overlay nature
  of annotations, i.e., text is essentially modelled as plain text, and annotations are attached to it.
  This way we can map complex text manipulation to primitive object operations.
  For many other content types it would often be extremly helpful being able to traverse the structure in both
  directions, from parent to children (which is already possible), and back from children to parent.

  We do not want to store a the id of a parent node into the children, as this would be redundant, and would increase the amount of necessary operations.
  Instead we want to establish a link dynamically on the Node instance when the id is set in the parent (during construction or when updated).

  The most in-obstrusive implementation is to add an 'operation:applied' hook, watching for such changes
  and setting the reference. First we will apply this only for specific node types.
  Later this will be derived from the schema.
  With Texture we want to investigate a further option: replacing the node model with a DOM.
*/

class ParentNodeHook {

  constructor(doc) {
    this.doc = doc
    this.table = {}
    doc.data.on('operation:applied', this._onOperationApplied, this)
  }

  _onOperationApplied(op) {
    const doc = this.doc
    const table = this.table
    let node = doc.get(op.path[0])
    // TODO: instead of hard coding this here we should compile a matcher
    // based on the document schema
    switch(op.type) {
      case 'create': {
        switch (node.type) {
          case 'list':
            _setParent(node, node.items)
            break
          case 'list-item': {
            _setRegisteredParent(node)
            break
          }
          case 'table':
            _setParent(node, node.cells)
            break
          case 'table-cell': {
            _setRegisteredParent(node)
            break
          }
          default:
            //
        }
        break
      }
      case 'update': {
        // ATTENTION: we only set parents but don't remove when they are deleted
        // assuming that if the parent gets deleted, the children get deleted too
        let update = op.diff
        switch(node.type) {
          case 'list':
            if (op.path[1] === 'items') {
              if (update.isInsert()) {
                _setParent(node, update.getValue())
              }
            }
            break
          case 'table':
            if (op.path[1] === 'cells') {
              if (update.isInsert()) {
                _setParent(node, update.getValue())
              }
            }
            break
          default:
            //
        }
        break
      }
      case 'set': {
        switch(node.type) {
          case 'list':
            if (op.path[1] === 'items') {
              _setParent(node, op.getValue())
            }
            break
          case 'table':
            if (op.path[1] === 'cells') {
              _setParent(node, op.getValue())
            }
            break
          default:
            //
        }
        break
      }
      default:
        //
    }

    function _setParent(parent, ids) {
      if (ids) {
        if (isArray(ids)) {
          ids.forEach(_set)
        } else {
          _set(ids)
        }
      }
      function _set(id) {
        // Note: it can happen, e.g. during deserialization, that the child node
        // is created later than the parent node
        // so we store the parent for later
        table[id] = parent
        let child = doc.get(id)
        if (child) {
          child.parent = parent
        }
      }
    }
    function _setRegisteredParent(child) {
      let parent = table[child.id]
      if (parent) {
        child.parent = parent
      }
    }
  }
}

ParentNodeHook.register = function(doc) {
  return new ParentNodeHook(doc)
}

export default ParentNodeHook