import isFunction from '../util/isFunction'
import isPlainObject from '../util/isPlainObject'
import DocumentChange from '../model/DocumentChange'
import TransactionDocument from '../model/TransactionDocument'

/*
  A transaction for editing a document in an EditorSession.

  Wherever you see `tx`, it is an instance of this class.

  The transaction is used to manipulate the document in a 'turtle-graphics' style.
  For that it maintains an internal state consisting of an array of operations, a selection, and
  the current surface.

  Usually, at the beginning of a transaction, one Surface is focused. This is used to initialize
  the transaction state. Depending on the type of Surface or the type of the current selection,
  some manipulations are allowed or others are not: it is not possible to create a ContainerAnnotation without
  a ContainerSelection, or pasting a list of nodes into a TextPropertyEditor will strip the structure and just
  the text content.

*/
class Transaction {

  /*
    @param {Document} doc
  */
  constructor(doc, editorSession) {
    this.document = doc
    this.editorSession = editorSession
    // the stage is essentially a clone of the document used to apply a sequence of document operations
    // without touching this document
    this.stageDoc = new TransactionDocument(doc, this)
    // internal state
    this.isTransacting = false
    this._state = 'idle'
    this._selection = null
    this._surface = null
  }

  dispose() {
    this.stageDoc.dispose()
  }

  get(...args) {
    return this.stageDoc.get(...args)
  }

  getDocument() {
    return this.stageDoc
  }

  getIndex(...args) {
    return this.stageDoc.getIndex(...args)
  }

  getRealPath(...args) {
    return this.stageDoc.getRealPath(...args)
  }

  getAnnotations(...args) {
    return this.stageDoc.getAnnotations(...args)
  }

  getSchema() {
    return this.document.getSchema()
  }

  create(nodeData) {
    this._ensureStarted()
    return this.stageDoc.create(nodeData)
  }

  createDefaultTextNode(content) {
    this._ensureStarted()
    return this.stageDoc.createDefaultTextNode(content)
  }

  delete(nodeId) {
    this._ensureStarted()
    return this.stageDoc.delete(nodeId)
  }

  set(path, value) {
    this._ensureStarted()
    return this.stageDoc.set(path, value)
  }

  update(path, diffOp) {
    this._ensureStarted()
    return this.stageDoc.update(path, diffOp)
  }

  get selection() {
    return this._selection
  }

  set selection(sel) {
    this.setSelection(sel)
  }

  /*
    TODO: want to simplify setting selections.
  */
  createSelection(...args) {
    return this.stageDoc.createSelection(...args)
  }

  setSelection(sel) {
    if (!sel) sel = Selection.nullSelection
    else if (isPlainObject(sel)) {
      sel = this.createSelection(sel)
    }
    if (!sel.isNull()) {
      if (sel.surfaceId && this.surfaceId !== sel.surfaceId) {
        console.warn('You should call tx.switchSurface() first.')
        this.switchSurface(sel.surfaceId)
      } else if (!sel.surfaceId && this._surface) {
        sel.surfaceId = this._surface.id
      }
      if (!sel.containerId && this._surface) {
        sel.containerId = this._surface.getContainerId()
      }
    }
    this._selection = sel
  }

  getSelection() {
    return this._selection
  }

  switchSurface(surfaceId) {
    let surface = this.editorSession.getSurface(surfaceId)
    if (!surface) throw new Error('Unknown surface '+surfaceId)
    this._surface = surface
  }

  get surfaceId() {
    return this._surface ? this._surface.id : null
  }

  rollback() {
    this.stageDoc._rollback()
  }

  // NOTE: ops are actually owned by TransactionDocument
  // we use the transaction document internally and not this instance
  get ops() {
    return this.stageDoc.ops
  }
  set ops(ops) {
    this.stageDoc.ops = ops
  }

  _apply(...args) {
    this.stageDoc._apply(...args)
  }

  _ensureStarted() {
    if (this._state !== 'started') throw new Error('Transaction has not been started, or cancelled or saved already.')
  }

  /**
    Start a transaction to manipulate the document

    @param {function} transformation a function(tx) that performs actions on the transaction document tx

    @example

    ```js
    doc.transaction(function(tx, args) {
      tx.update(...)
      ...
      return {
        selection: newSelection
      }
    })
    ```
  */
  _recordChange(transformation, selection, surface) {
    // TODO: we could get rid of isTransacting and use this._state instead
    if (this.isTransacting) throw new Error('Nested transactions are not supported.')
    if (!isFunction(transformation)) throw new Error('Document.transaction() requires a transformation function.')
    this.isTransacting = true
    this._reset()
    this._state = 'started'
    let change
    try {
      /*
        TODO: I would like to separate selection and surface, at least from the usage pov.
        I.e. focus a surface first using tx.switchSurface(surfaceId), then use tx.setSelection().
        In the most cases this can be done automatically, taking the current editorSession state.
      */
      this._selection = selection
      this._surface = surface
      let selBefore = selection
      let result = transformation(this, {
        selection: this.getSelection()
      }) || {}
      let ops = this.ops
      if (ops.length > 0) {
        change = new DocumentChange(ops, this._before, this._after)
        change.before = { selection: selBefore }
        // TODO: we need to rethink if we really want it the old way, i.e. returning a selection
        // I'd prefer tx.setSelection(...)
        if (result.hasOwnProperty('selection')) {
          this.setSelection(result.selection)
        }
        change.after = { selection: this.getSelection() }
      }
      this._state = 'finished'
    } finally {
      if (this._state !== 'finished') {
        this.rollback()
      }
      this._state = 'idle'
      this.isTransacting = false
    }
    return change
  }

  _reset() {
    this._before = {}
    this._after = {}
    this.stageDoc._reset()
    this._info = {}
  }
}

export default Transaction
