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

  The most unobtrusive implementation is to add an 'operation:applied' hook, watching for such changes
  and setting the reference.
*/
export default class ParentNodeHook {
  constructor (doc) {
    this.doc = doc
    // parents by id of child nodes
    this.parents = {}
    doc.data.on('operation:applied', this._onOperationApplied, this)
  }

  _onOperationApplied (op) {
    const doc = this.doc
    let node = doc.get(op.path[0])
    let nodeSchema, hasOwnedProperties
    if (node) {
      nodeSchema = node.getSchema()
      hasOwnedProperties = nodeSchema.hasOwnedProperties()
    }
    // TODO: instead of hard coding this here we should compile a matcher
    // based on the document schema
    switch (op.type) {
      case 'create': {
        if (hasOwnedProperties) {
          nodeSchema.getOwnedProperties().forEach(p => {
            let refs = node[p.name]
            if (refs) {
              this._setParent(node, refs)
            }
            this._setRegisteredParent(node)
          })
        }
        break
      }
      case 'update': {
        if (hasOwnedProperties) {
          let propName = op.path[1]
          if (nodeSchema.isOwned(propName)) {
            let update = op.diff
            if (update.isDelete()) {
              this._setParent(null, update.getValue())
            } else {
              this._setParent(node, update.getValue())
            }
          }
        }
        break
      }
      case 'set': {
        if (hasOwnedProperties) {
          let propName = op.path[1]
          if (nodeSchema.isOwned(propName)) {
            let oldValue = op.getOldValue()
            let newValue = op.getValue()
            // Note: _setParent takes either an array or a single id
            this._setParent(null, oldValue)
            this._setParent(node, newValue)
          }
        }
        break
      }
      default:
        //
    }
  }

  _setParent (parent, ids) {
    if (ids) {
      if (isArray(ids)) {
        ids.forEach(id => this.__setParent(parent, id))
      } else {
        this.__setParent(parent, ids)
      }
    }
  }

  __setParent (parent, id) {
    // Note: it can happen, e.g. during deserialization, that the child node
    // is created later than the parent node
    // so we store the parent for later
    // TODO: is this really still true? we have improved the new behavior in document.createFromDocument()
    // so that it considers the ownership
    this.parents[id] = parent
    let child = this.doc.get(id)
    if (!child) {
      console.error('FIXME: parent is created before child, or child id is invalid')
    } else {
      child.setParent(parent)
    }
  }

  _setRegisteredParent (child) {
    let parent = this.parents[child.id]
    if (parent) {
      child.setParent(parent)
    }
  }
}

ParentNodeHook.register = function (doc) {
  return new ParentNodeHook(doc)
}
