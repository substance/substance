import forEach from '../util/forEach'
import uuid from '../util/uuid'
import Document from './Document'
import IncrementalData from './data/IncrementalData'
import DocumentNodeFactory from './DocumentNodeFactory'
import ParentNodeHook from './ParentNodeHook'

/**
  A {@link Document} instance that is used during transaction.

  During editing a TransactionDocument is kept up-to-date with the real one.
  Whenever a transaction is started on the document, a TransactionDocument is used to
  record changes, which are applied en-bloc when the transaction is saved.

  The transaction document is the common way to manipulate the document.
  It provides a 'turtle-graphics' style API, i.e., it has a state

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
  constructor(document) {
    super('SKIP')

    this.schema = document.schema
    this.nodeFactory = new DocumentNodeFactory(this)
    this.data = new IncrementalData(this.schema, {
      nodeFactory: this.nodeFactory
    })

    this.document = document

    // ops recorded since transaction start
    this.ops = []
    this.lastOp = null

    // copy all indexes
    forEach(document.data.indexes, function(index, name) {
      this.data.addIndex(name, index.clone())
    }.bind(this))

    // ATTENTION: this must before loading the seed
    ParentNodeHook.register(this)

    this.loadSeed(document.toJSON())

    // make sure that we mirror all changes that are done outside of transactions
    document.on('document:changed', this._onDocumentChanged, this)
  }

  dispose() {
    this.document.off(this)
  }

  create(nodeData) {
    if (!nodeData.id) {
      nodeData.id = uuid(nodeData.type)
    }
    if (!nodeData.type) {
      throw new Error('No node type provided')
    }
    this.lastOp = this.data.create(nodeData)
    if (this.lastOp) {
      this.ops.push(this.lastOp)
      return this.data.get(nodeData.id)
    }
  }

  createDefaultTextNode(text, dir) {
    return this.create({
      type: this.getSchema().getDefaultTextType(),
      content: text || '',
      direction: dir
    })
  }

  delete(nodeId) {
    this.lastOp = this.data.delete(nodeId)
    if (this.lastOp) {
      this.ops.push(this.lastOp)
    }
  }

  set(path, value) {
    this.lastOp = this.data.set(path, value)
    if (this.lastOp) {
      this.ops.push(this.lastOp)
    }
  }

  update(path, diffOp) {
    let op = this.lastOp = this.data.update(path, diffOp)
    if (op) {
      this.ops.push(op)
      return op
    }
  }

  _onDocumentChanged(change) {
    // NOTE: this is hooked to document:changed (low-level), to make sure that we
    // update the transaction document too when the document is manipulated directly, e.g. using `document.create(...)`
    this._apply(change)
  }

  _apply(documentChange) {
    documentChange.ops.forEach(function(op) {
      this.data.apply(op)
    }.bind(this))
  }

  _reset() {
    this.ops = []
    this.lastOp = null
  }

  _rollback() {
    for (var i = this.ops.length - 1; i >= 0; i--) {
      this.data.apply(this.ops[i].invert())
    }
    this.ops = []
    this.lastOp = null
  }

  newInstance() {
    return this.document.newInstance()
  }
}

TransactionDocument.prototype._isTransactionDocument = true

export default TransactionDocument
