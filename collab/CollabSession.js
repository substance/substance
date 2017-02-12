import cloneDeep from '../util/cloneDeep'
import Err from '../util/SubstanceError'
import EditorSession from '../model/EditorSession'
import DocumentChange from '../model/DocumentChange'

/*
  Session that is connected to a Substance Hub allowing
  collaboration in real-time.

  Requires a connected and authenticated collabClient.
*/
class CollabSession extends EditorSession {

  constructor(doc, config) {
    super(doc, config)
    config = config || {}
    this.config = config
    this.collabClient = config.collabClient
    if (config.docVersion) {
      console.warn('config.docVersion is deprecated: Use config.version instead')
    }
    if (config.docVersion) {
      console.warn('config.docId is deprecated: Use config.documentId instead')
    }
    this.version = config.version
    this.documentId = config.documentId || config.docId
    if (config.autoSync !== undefined) {
      this.autoSync = config.autoSync
    } else {
      this.autoSync = true
    }
    if (!this.documentId) {
      throw new Err('InvalidArgumentsError', {message: 'documentId is mandatory'})
    }
    if (typeof this.version === undefined) {
      throw new Err('InvalidArgumentsError', {message: 'version is mandatory'})
    }
    // Internal state
    this._connected = false // gets flipped to true in syncDone
    this._nextChange = null // next change to be sent over the wire
    this._pendingChange = null // change that is currently being synced
    this._pendingSync = false
    this._error = null
    // Note: registering a second document:changed handler where we trigger sync requests
    this.onUpdate('document', this.afterDocumentChange, this)
    // This happens on a reconnect
    this.collabClient.on('connected', this.onCollabClientConnected, this)
    this.collabClient.on('disconnected', this.onCollabClientDisconnected, this)
    this.collabClient.on('message', this._onMessage.bind(this))
    // Attempt to open a document immediately, but only if the collabClient is
    // already connected. If not the onCollabClientConnected handler will take
    // care of it once websocket connection is ready.
    if (this.collabClient.isConnected() && this.autoSync) {
      this.sync()
    }
  }

  /*
    Unregister event handlers. Call this before throwing away
    a CollabSession reference. Otherwise you will leak memory
  */
  dispose() {
    this.disconnect()
    this.collabClient.off(this)
  }

  /*
    Explicit disconnect initiated by user
  */
  disconnect() {
    // Let the server know we no longer want to edit this document
    let msg = {
      type: 'disconnect',
      documentId: this.documentId
    }
    // We abort pening syncs
    this._abortSync()
    this._send(msg)
  }

  /*
    Synchronize with collab server
  */
  sync() {
    // If there is something to sync and there is no running sync
    if (this.__canSync()) {
      let nextChange = this._nextChange
      let msg = {
        type: 'sync',
        documentId: this.documentId,
        version: this.version,
        change: nextChange ? this.serializeChange(nextChange) : undefined
      }
      this._send(msg)
      this._pendingSync = true
      this._pendingChange = nextChange

      // Can be used to reset errors that arised from previous syncs.
      // When a new sync is started, users can use this event to unset the error
      this.emit('sync')
      this._nextChange = null
      this._error = null
    } else {
      console.error('Can not sync. Either collabClient is not connected or already syncing')
    }
  }

  getCollaborators() {
    return this.collaborators
  }

  isConnected() {
    return this._connected
  }

  serializeChange(change) {
    return change.toJSON()
  }

  deserializeChange(serializedChange) {
    return DocumentChange.fromJSON(serializedChange)
  }

  /* Message handlers
     ================ */

  /*
    Dispatching of remote messages.
  */
  _onMessage(msg) {
    // Skip if message is not addressing this document
    if (msg.documentId !== this.documentId) {
      return false
    }
    // clone the msg to make sure that the original does not get altered
    msg = cloneDeep(msg)
    switch (msg.type) {
      case 'syncDone':
        this.syncDone(msg)
        break
      case 'syncError':
        this.syncError(msg)
        break
      case 'update':
        this.update(msg)
        break
      case 'disconnectDone':
        this.disconnectDone(msg)
        break
      case 'error':
        this.error(msg)
        break
      default:
        console.error('CollabSession: unsupported message', msg.type, msg)
        return false
    }
    return true
  }

  /*
    Send message

    Returns true if sent, false if not sent (e.g. when not connected)
  */
  _send(msg) {
    if (this.collabClient.isConnected()) {
      this.collabClient.send(msg)
      return true
    } else {
      console.warn('Try not to call _send when disconnected. Skipping message', msg)
      return false
    }
  }

  /*
    Apply remote update

    We receive an update from the server. We only apply the remote change if
    there's no pending commit. applyRemoteUpdate is also called for selection
    updates.

    If we are currently in the middle of a sync or have local changes we just
    ignore the update. We will receive all server updates on the next syncDone.
  */
  update(args) {
    // console.log('CollabSession.update(): received remote update', args);
    let serverChange = args.change
    let serverVersion = args.version

    if (!this._nextChange && !this._pendingSync) {
      if (serverChange) {
        serverChange = this.deserializeChange(serverChange)
        this._applyRemoteChange(serverChange)
      }
      if (serverVersion) {
        this.version = serverVersion
      }
      this.startFlow()
    } else {
      console.info('skipped remote update. Pending sync or local changes.');
    }
  }

  /*
    Sync has completed

    We apply server changes that happened in the meanwhile and we update
    the collaborators (=selections etc.)
  */
  syncDone(args) {
    // console.log('syncDone', args)
    let serverChange = args.serverChange
    let serverVersion = args.version

    if (serverChange) {
      serverChange = this.deserializeChange(serverChange)
      this._applyRemoteChange(serverChange)
    }
    this.version = serverVersion
    // Important: after sync is done we need to reset _pendingChange and _error
    // In this state we can safely listen to
    this._pendingChange = null
    this._pendingSync = false
    this._error = null
    // Each time the sync worked we consider the system connected
    this._connected = true
    this.startFlow()
    this.emit('connected')
    // Attempt to sync again (maybe we have new local changes)
    this._requestSync()
  }

  /*
    Handle sync error
  */
  syncError(error) {
    console.info('SyncError occured. Aborting sync', error)
    this._abortSync()
  }

  disconnectDone() {
    // console.log('disconnect done');
    // Let the server know we no longer want to edit this document
    this._afterDisconnected()
  }

  /*
    Handle errors. This gets called if any request produced
    an error on the server.
  */
  error(message) {
    let error = message.error
    let errorFn = this[error.name]
    let err = Err.fromJSON(error)

    if (!errorFn) {
      error('CollabSession: unsupported error', error.name)
      return false
    }

    this.emit('error', err)
    errorFn = errorFn.bind(this)
    errorFn(err)
  }


  /* Event handlers
     ============== */

  afterDocumentChange(change, info) {
    // Record local changes into nextCommit
    if (!info.remote) {
      this._recordChange(change)
    }
  }

  /*
    A new authenticated collabClient connection is available.

    This happens in a reconnect scenario.
  */
  onCollabClientConnected() {
    // console.log('CollabClient connected');
    if (this.autoSync) {
      this.sync()
    }
  }

  /*
    Implicit disconnect (server connection drop out)
  */
  onCollabClientDisconnected() {
    // console.log('CollabClient disconnected');
    this._abortSync()
    if (this._connected) {
      this._afterDisconnected()
    }
  }

  /* Internal methods
     ================ */

  _commit(change, info) {
    this._commitChange(change, info)
    this.startFlow()
  }

  /*
    Apply a change to the document
  */
  _applyRemoteChange(change) {
    // console.log('CollabSession: applying remote change');
    if (change.ops.length > 0) {
      this._transaction._apply(change)
      this.getDocument()._apply(change)
      this._setDirty('document')
      // Only undo+redo history is updated according to the new change
      this._transformLocalChangeHistory(change)
      this._setSelection(this._transformSelection(change))
      this._change = change
      this._info = { remote: true }
      this.startFlow()
    }
  }

  /*
    We record all local changes into a single change (aka commit) that
  */
  _recordChange(change) {
    if (!this._nextChange) {
      this._nextChange = change
    } else {
      // Merge new change into nextCommit
      this._nextChange.ops = this._nextChange.ops.concat(change.ops)
      this._nextChange.after = change.after
    }
    this._requestSync()
  }

  __canSync() {
    return this.collabClient.isConnected() && !this._pendingSync
  }

  /*
    Triggers a new sync if there is a new change and no pending sync
  */
  _requestSync() {
    if (this._nextChange && this.__canSync()) {
      this.sync()
    }
  }

  /*
    Abots the currently running sync.

    This is called _onDisconnect and could be called after a sync request
    times out (not yet implemented)
  */
  _abortSync() {
    let newNextChange = this._nextChange

    if (this._pendingChange) {
      newNextChange = this._pendingChange
      // If we have local changes also, we append them to the new nextChange
      if (this._nextChange) {
        newNextChange.ops = newNextChange.ops.concat(this._nextChange.ops)
        newNextChange.after = this._nextChange.after
      }
      this._pendingChange = null
    }
    this._pendingSync = false
    this._error = null
    this._nextChange = newNextChange
  }

  /*
    Sets the correct state after a collab session has been disconnected
    either explicitly or triggered by a connection drop out.
  */
  _afterDisconnected() {
    this._connected = false
    this.emit('disconnected')
  }

  /*
    Returns true if there are local changes
  */
  _hasLocalChanges() {
    return this._nextChange && this._nextChange.ops.length > 0
  }

}

export default CollabSession
