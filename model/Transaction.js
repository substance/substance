import isFunction from '../util/isFunction'
import DocumentChange from '../model/DocumentChange'
import TransactionDocument from '../model/TransactionDocument'
import EditingInterface from '../model/EditingInterface'

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
class Transaction extends EditingInterface {

  /*
    @param {Document} doc
  */
  constructor(doc, editorSession) {
    super()

    // TransactionDocument is essentially a clone of the document used to apply a sequence of document operations
    // without touching the original document
    this._stageDoc = this._document = new TransactionDocument(doc, this)
    this._editorSession = editorSession

    // internal state
    this._isTransacting = false
    this._state = 'idle'
    this._surface = null
  }

  dispose() {
    this._stageDoc.dispose()
  }

  setSelection(sel) {
    super.setSelection(sel)

    // NOTE: we might want to remove 'surfaceId' from selection, and instead
    // map surfaces to model paths. For the time being we keep it the old
    // way, but take it from the currently focused surface
    sel = this._selection
    if (!sel.isNull()) {
      if (!sel.surfaceId) {
        // TODO: We could check if the selection is valid within the given surface
        let surface = this._editorSession.getFocusedSurface()
        if (surface) {
          sel.surfaceId = surface.id
        } else {
          // TODO: instead of warning we could try to 'find' a suitable surface. However, this would also be a bit 'magical'
          console.warn('No focused surface. Selection will not be rendered.')
        }
      }
    }
  }

  // internal API

  // NOTE: ops are actually owned by TransactionDocument
  // we use the transaction document internally and not this instance
  get ops() {
    return this._stageDoc.ops
  }
  set ops(ops) {
    this._stageDoc.ops = ops
  }

  rollback() {
    this._stageDoc._rollback()
  }

  _apply(...args) {
    this._stageDoc._apply(...args)
  }

  // _ensureStarted() {
  //   if (this._state !== 'started') throw new Error('Transaction has not been started, or cancelled or saved already.')
  // }

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
  _recordChange(transformation, selection) {
    // TODO: we could get rid of isTransacting and use this._state instead
    if (this._isTransacting) throw new Error('Nested transactions are not supported.')
    if (!isFunction(transformation)) throw new Error('Document.transaction() requires a transformation function.')
    this._isTransacting = true
    this._reset()
    this._state = 'started'
    let change
    try {
      this.setSelection(selection)
      let selBefore = this.getSelection()
      transformation(this, {
        selection: selBefore
      })
      let ops = this.ops
      if (ops.length > 0) {
        change = new DocumentChange(ops, this._before, this._after)
        change.before = { selection: selBefore }
        change.after = { selection: this.getSelection() }
      }
      this._state = 'finished'
    } finally {
      if (this._state !== 'finished') {
        this.rollback()
      }
      this._state = 'idle'
      this._isTransacting = false
    }
    return change
  }

  _reset() {
    this._before = {}
    this._after = {}
    this._stageDoc._reset()
    this._info = {}
    this.setSelection(null)
  }
}

export default Transaction
