import isFunction from 'lodash/isFunction'
import extend from 'lodash/extend'
import forEach from '../util/forEach'
import uuid from '../util/uuid'
import Document from './Document'
import DocumentChange from './DocumentChange'
import IncrementalData from './data/IncrementalData'
import DocumentNodeFactory from './DocumentNodeFactory'
import FileNode from '../packages/file/FileNode'

var __id__ = 0

/**
  A {@link Document} instance that is used during transaction.

  During editing a TransactionDocument is kept up-to-date with the real one.
  Whenever a transaction is started on the document, a TransactionDocument is used to
  record changes, which are applied en-bloc when the transaction is saved.


  @example

  To start a transaction run

  ```
  doc.transaction(function(tx) {
    // use tx to record changes
  })
  ```
*/
class TransactionDocument extends Document {

  /**
    @param {model/Document} document a document instance
  */
  constructor(document, session) {
    super('SKIP')

    this.__id__ = "TX_"+__id__++

    this.schema = document.schema
    this.nodeFactory = new DocumentNodeFactory(this)
    this.data = new IncrementalData(this.schema, {
      nodeFactory: this.nodeFactory
    })

    this.document = document
    this.session = session

    // ops recorded since transaction start
    this.ops = []
    // app information state information used to recover the state before the transaction
    // when calling undo
    this.before = {}
    // HACK: copying all indexes
    forEach(document.data.indexes, function(index, name) {
      this.data.addIndex(name, index.clone())
    }.bind(this))

    this.loadSeed(document.toJSON())

    // make sure that we mirror all changes that are done outside of transactions
    document.on('document:changed', this._onDocumentChanged, this)
  }

  dispose() {
    this.document.off(this)
  }

  reset() {
    this.ops = []
    this.before = {}
  }

  create(nodeData) {
    if (!nodeData.id) {
      nodeData.id = uuid(nodeData.type)
    }
    if (!nodeData.type) {
      throw new Error('No node type provided')
    }
    var op = this.data.create(nodeData)
    if (!op) return
    this.ops.push(op)
    // TODO: incremental graph returns op not the node,
    // so probably here we should too?
    return this.data.get(nodeData.id)
  }

  createDefaultTextNode(content) {
    return this.create({
      type: this.getSchema().getDefaultTextType(),
      content: content || ''
    })
  }

  delete(nodeId) {
    var op = this.data.delete(nodeId)
    if (!op) return
    this.ops.push(op)
    return op
  }

  set(path, value) {
    var realPath = this.getRealPath(path)
    if (!realPath) throw new Error('Invalid path')
    var op = this.data.set(realPath, value)
    if (!op) return
    this.ops.push(op)
    return op
  }

  update(path, diffOp) {
    var realPath = this.getRealPath(path)
    if (!realPath) throw new Error('Invalid path')
    var op = this.data.update(realPath, diffOp)
    if (!op) return
    this.ops.push(op)
    return op
  }

  /**
    Cancels the current transaction, discarding all changes recorded so far.
  */
  cancel() {
    this._cancelTransaction()
  }

  getOperations() {
    return this.ops
  }

  _onDocumentChanged(change) {
    this._apply(change)
  }

  _apply(documentChange) {
    documentChange.ops.forEach(function(op) {
      this.data.apply(op)
    }.bind(this))
  }

  _transaction(transformation) {
    if (!isFunction(transformation)) {
      throw new Error('Document.transaction() requires a transformation function.')
    }
    // var time = Date.now()
    // HACK: ATM we can't deep clone as we do not have a deserialization
    // for selections.
    this._startTransaction()
    // console.log('Starting the transaction took', Date.now() - time)
    try {
      // time = Date.now()
      transformation(this, {})
      // console.log('Executing the transformation took', Date.now() - time)
      // save automatically if not canceled
      if (!this._isCancelled) {
        return this._saveTransaction()
      }
    } finally {
      if (!this._isSaved) {
        this.cancel()
      }
      // HACK: making sure that the state is reset when an exception has occurred
      this.session.isTransacting = false
    }
  }

  _startTransaction() {
    this.before = {}
    this.after = {}
    this.info = {}
    this._isCancelled = false
    this._isSaved = false
    // TODO: we should use a callback and not an event
    // Note: this is used to initialize
    this.document.emit('transaction:started', this)
  }

  _saveTransaction() {
    if (this._isCancelled) {
      return
    }
    var beforeState = this.before
    var afterState = extend({}, beforeState, this.after)
    var ops = this.ops
    var change
    if (ops.length > 0) {
      change = new DocumentChange(ops, beforeState, afterState)
    }
    this._isSaved = true
    this.reset()
    return change
  }

  _cancelTransaction() {
    // revert all recorded changes
    for (var i = this.ops.length - 1; i >= 0; i--) {
      this.data.apply(this.ops[i].invert())
    }
    // update state
    this._isCancelled = true
    this.reset()
  }

  _getFileStore() {
    return this.document._getFileStore()
  }

  newInstance() {
    return this.document.newInstance()
  }

}

TransactionDocument.prototype.isTransactionDocument = true

export default TransactionDocument
