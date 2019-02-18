import isFunction from '../util/isFunction'
import DocumentChange from './DocumentChange'

/**
 * A DocumentStage maintains a copy of a master document used as a stage
 * for recording operations aka transactions.
 */
export default class DocumentStage {
  /**
   * @param {DocumentSession} masterSession
   */
  constructor (masterSession) {
    this.masterSession = masterSession
    // create a copy of the master document
    let masterDocument = masterSession.getDocument()
    this.masterDocument = masterDocument

    // setting up a stage version of the master document
    this.stageDocument = masterDocument.newInstance().createFromDocument(masterDocument)
    // Note: we suppress change events on the stage document
    // TODO: is this really necessary? I.e. nobody should be listening to change events anyways
    this.stageDocument._isTransactionDocument = true
    // maintaining a version for the stage to be able to sync with the master document later
    this.stageVersion = this._getMasterVersion()

    // used as 'tx' in transactions
    // Note: the Document implementation can provide a customized tx interface here
    this.tx = this.stageDocument.createEditingInterface()
    // internal state to detect sitatuations where the programmer tries to start
    // a transaction while there is a transaction already going on
    this._isTransacting = false
  }

  dispose () {
    this.stageDocument.dispose()
  }

  // internal API

  _reset () {
    this.stageDocument._ops.length = 0
  }

  _transaction (transformation, info, before = {}) {
    if (this._isTransacting) throw new Error('Nested transactions are not supported.')
    if (!isFunction(transformation)) throw new Error('Document.transaction() requires a transformation function.')
    let hasFinished = false
    this._isTransacting = true
    // clearing transaction state
    this._reset()
    // bringin the stage document in a correct state before recoding changes
    this._sync()
    // ATTENTION: by recording a change the stage document gets out of sync with the master document
    let change
    try {
      const tx = this.tx
      if (before.selection) {
        tx.selection = before.selection
      }
      transformation(tx)
      let ops = this.stageDocument._ops
      if (ops.length > 0) {
        change = new DocumentChange(ops, {}, {})
        change.info = info
        change.before = before
        change.after = {
          selection: tx.selection
        }
        // ATTENTION: incrementing the stage version automatically
        // because a non-empty change is expected to be committed
        this.stageVersion++
        // Note: at some point we had logic here that was validating a change
        // before applying it (XMLDocument)
        // I have removed this because XMLDocuments where not really the way to go
      }
      hasFinished = true
    } finally {
      // on error we rollback the changes on the stage document
      if (!hasFinished) {
        this._rollback()
      }
      this._reset()
      this._isTransacting = false
    }
    return change
  }

  _sync () {
    const masterVersion = this._getMasterVersion()
    const stageVersion = this.stageVersion
    if (stageVersion < masterVersion) {
      let stageDocument = this.stageDocument
      let changes = this.masterSession._history.slice(stageVersion + 1)
      for (let change of changes) {
        stageDocument._apply(change)
      }
      this.stageVersion = masterVersion
    } else if (stageVersion > masterVersion) {
      // Note: I do not want this as this can only come
      // from a bug in the transaction implementation
      throw new Error('stage document is in an unexpected state.')
    }
  }

  _rollback () {
    const stage = this.stageDocument
    let ops = stage._ops
    for (let i = ops.length - 1; i >= 0; i--) {
      stage._applyOp(ops[i].invert())
    }
    this._reset()
  }

  _getMasterVersion () {
    return this.masterSession._history.length
  }
}
