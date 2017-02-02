import EventEmitter from '../util/EventEmitter'
import Anchor from './Anchor'

/**
  A document selection. Refers to a Substance document model, not to the DOM.
*/
class Selection {

  constructor() {
    // Internal stuff
    var _internal = {}
    Object.defineProperty(this, "_internal", {
      enumerable: false,
      value: _internal
    })
      // set when attached to document
    _internal.doc = null
  }

  clone() {
    var newSel = this._clone()
    if (this._internal.doc) {
      newSel.attach(this._internal.doc)
    }
    return newSel
  }

  /**
    @returns {Document} The attached document instance
  */
  getDocument() {
    var doc = this._internal.doc
    if (!doc) {
      throw new Error('Selection is not attached to a document.')
    }
    return doc
  }

  isAttached() {
    return Boolean(this._internal.doc)
  }

  /**
    Attach document to the selection.

    @internal
    @param {Document} doc document to attach
    @returns {this}
  */
  attach(doc) {
    this._internal.doc = doc
    return this
  }

  /**
    @returns {Boolean} true when selection is null.
  */
  isNull() { return false; }

  /**
    @returns {Boolean} true for property selections
  */
  isPropertySelection() { return false; }

  /**
    @returns {Boolean} true if selection is a {@link model/ContainerSelection}
  */
  isContainerSelection() { return false; }

  /**
    @returns {Boolean} true if selection is a {@link model/NodeSelection}
  */
  isNodeSelection() { return false; }

  isCustomSelection() { return false; }

  /**
    @returns {Boolean} true when selection is collapsed
  */
  isCollapsed() { return true; }

  /**
    @returns {Boolean} true if startOffset < endOffset
  */
  isReverse() { return false; }

  getType() {
    throw new Error('Selection.getType() is abstract.')
  }

  get type() {
    return this.getType()
  }

  /**
    @returns {Boolean} true if selection equals `other` selection
  */
  equals(other) {
    if (this === other) {
      return true
    } else if (!other) {
      return false
    } else if (this.isNull() !== other.isNull()) {
      return false
    } else if (this.getType() !== other.getType()) {
      return false
    } else {
      // Note: returning true here, so that sub-classes
      // can call this as a predicate in their expression
      return true
    }
  }

  /**
    @returns {String} This selection as human readable string.
  */
  toString() {
    return "null"
  }

  /**
    Convert container selection to JSON.

    @abstract
    @returns {Object}
  */
  toJSON() {
    throw new Error('This method is abstract.')
  }

  /**
    Get selection fragments for this selection.

    A selection fragment is bound to a single property.
    @returns {Selection.Fragment[]}
  */
  getFragments() {
    return []
  }

  createWith(update) {
    let SelectionClass = this.constructor
    let data = this.toJSON()
    Object.assign(data, update)
    return SelectionClass.fromJSON(data)
  }
}

// for duck-typed instanceof
Selection.prototype._isSelection = true

/*
  Class to represent null selections.

  @internal
*/
class NullSelection extends Selection {

  isNull() {
    return true
  }

  getType() {
    return 'null'
  }

  toJSON() {
    return null
  }

  clone() {
    return this
  }
}

/**
  We use a singleton to represent NullSelections.

  @type {model/Selection}
*/

Selection.nullSelection = Object.freeze(new NullSelection())

/**
  @internal
*/
class SelectionFragment extends EventEmitter {

  constructor(path, startOffset, endOffset, full) {
    super()

    this.type = "selection-fragment"
    this.path = path
    this.startOffset = startOffset
    this.endOffset = endOffset || startOffset
    this.full = Boolean(full)
  }

  isAnchor() {
    return false
  }

  isInline() {
    return false
  }

  isPropertyFragment() {
    return true
  }

  isNodeFragment() {
    return false
  }

  isFull() {
    return this.full
  }

  isPartial() {
    return !this.full
  }

  getNodeId() {
    return this.path[0]
  }

}

Selection.Fragment = SelectionFragment


class NodeFragment extends EventEmitter {

  constructor(nodeId) {
    super()

    this.type = "node-fragment"
    this.nodeId = nodeId
    this.path = [nodeId]
  }

  isAnchor() {
    return false
  }

  isInline() {
    return false
  }

  isPropertyFragment() {
    return false
  }

  isNodeFragment() {
    return true
  }

  isFull() {
    return true
  }

  isPartial() {
    return false
  }

  getNodeId() {
    return this.nodeId
  }
}

Selection.NodeFragment = NodeFragment

/**
  Describe the cursor when creating selection fragments.
  This is used for rendering selections.

  @internal
*/
class Cursor extends Anchor {

  constructor(path, offset) {
    super(path, offset)

    this.type = "cursor"
  }

  isPropertyFragment() {
    return false
  }

  isNodeFragment() {
    return false
  }

}

Selection.Cursor = Cursor

export default Selection
