import EventEmitter from '../util/EventEmitter'
import extend from '../util/extend'
import forEach from '../util/forEach'
import map from '../util/map'

import DocumentChange from '../model/DocumentChange'
import Err from '../util/SubstanceError'

/*
  Engine for realizing collaborative editing. Implements the server-methods of
  real time editing as a reusable library.
*/
class CollabEngine extends EventEmitter {

  constructor(documentEngine) {
    super()
    this.documentEngine = documentEngine
    // Active collaborators
    this._collaborators = {}
  }

  /*
    Register collaborator for a given documentId
  */
  _register(collaboratorId, documentId, collaboratorInfo) {
    let collaborator = this._collaborators[collaboratorId]

    if (!collaborator) {
      collaborator = this._collaborators[collaboratorId] = {
        collaboratorId: collaboratorId,
        documents: {}
      }
    }

    // Extend with collaboratorInfo if available
    collaborator.info = collaboratorInfo

    // Register document
    collaborator.documents[documentId] = {}
  }

  /*
    Unregister collaborator id from document
  */
  _unregister(collaboratorId, documentId) {
    let collaborator = this._collaborators[collaboratorId]
    delete collaborator.documents[documentId]
    let docCount = Object.keys(collaborator.documents).length
    // If there is no doc left, we can remove the entire collaborator entry
    if (docCount === 0) {
      delete this._collaborators[collaboratorId]
    }
  }

  /*
    Get list of active documents for a given collaboratorId
  */
  getDocumentIds(collaboratorId) {
    let collaborator = this._collaborators[collaboratorId]
    if (!collaborator) {
      // console.log('CollabEngine.getDocumentIds', collaboratorId, 'not found');
      // console.log('CollabEngine._collaborators', this._collaborators);
      return []
    }
    return Object.keys(collaborator.documents)
  }

  /*
    Get collaborators for a specific document
  */
  getCollaborators(documentId, collaboratorId) {
    let collaborators = {}
    forEach(this._collaborators, function(collab) {
      let doc = collab.documents[documentId]
      if (doc && collab.collaboratorId !== collaboratorId) {
        let entry = {
          // selection: doc.selection,
          collaboratorId: collab.collaboratorId
        }
        entry = extend({}, collab.info, entry)
        collaborators[collab.collaboratorId] = entry
      }
    })
    return collaborators
  }

  /*
    Get only collaborator ids for a specific document
  */
  getCollaboratorIds(documentId, collaboratorId) {
    let collaborators = this.getCollaborators(documentId, collaboratorId)
    return map(collaborators, function(c) {
      return c.collaboratorId
    })
  }

  /*
    Client starts a sync

    @param args.documentId
    @param args.version The client's document version (0 if client starts with an empty doc)
    @param args.change pending client change

    Note: a client can reconnect having a pending change
    which is similar to the commit case
  */
  sync({documentId, version, change, collaboratorId}, cb) {
    this._sync({documentId, version, change}, function(err, result) {
      if (err) return cb(err)
      // Registers the collaborator If not already registered for that document
      this._register(collaboratorId, documentId)
      cb(null, result)
    }.bind(this))
  }

  /*
    Internal implementation of sync


    @param {String} args.documentId document id
    @param {Number} args.version client version
    @param {Number} args.change new change (optional)

    OUT: version, change (rebased client change), serverChange (ustream ops)
  */
  _sync({documentId, version, change}, cb) {
    this.documentEngine.getVersion(documentId, (err, serverVersion) => {
      if (version > serverVersion) {
        cb(new Err('InvalidVersionError', {
          message: 'Client version greater than server version'
        }))
      } else if (change && serverVersion === version) {
        this._syncFF({documentId, version, change}, cb)
      } else if (change && serverVersion > version) {
        this._syncRB({documentId, version, change}, cb)
      } else if (!change) {
        // E.g. when a client joins a session
        this._syncPullOnly({documentId, version, change}, cb)
      } else {
        console.warn('Unhandled case')
      }
    })
  }

  _syncPullOnly({documentId, version, change}, cb) {
    console.warn('This code is not yet tested')
    this.documentEngine.getChanges(documentId, version, (err, changes) => {
      let serverChange

      // Collect ops from all changes to turn them into a single change
      if (changes.length > 0) {
        let ops = []
        changes.forEach((change) => {
          ops = ops.concat(change.ops)
        })
        serverChange = new DocumentChange(ops, {}, {})
        serverChange = this.serializeChange(serverChange)
      }
      cb(null, {
        serverChange: serverChange,
        change: change,
        version: version
      })
    })
  }

  /*
    Fast forward sync (client version = server version)
  */
  _syncFF({documentId, change}, cb) {
    this.documentEngine.addChange(documentId, change, (err, serverVersion) => {
      if (err) return cb(err)
      cb(null, {
        change: change, // collaborators must be notified
        serverChange: null,
        version: serverVersion
      })
    })
  }

  /*
    Rebased sync (client version < server version)
  */
  _syncRB({documentId, change, version}, cb) {
    this._rebaseChange({documentId, change, version}, function(err, rebased) {
      // result has change, changes, version (serverversion)
      if (err) return cb(err)
      // Store the rebased commit
      this.documentEngine.addChange(
        documentId,
        change,
        function(err, serverVersion) {
          if (err) return cb(err)
          cb(null, {
            change: rebased.change,
            // collaborators must be notified
            serverChange: rebased.serverChange,
            version: serverVersion
          })
        }
      )
    }.bind(this))
  }

  /*
    Rebase change

    IN: documentId, change, version (client version)
    OUT: change, serverChange, version (server version)
  */
  _rebaseChange({documentId, change, version}, cb) {
    this.documentEngine.getChanges(documentId, version, function(err, result) {
      // HACK: it happened that result.changes was empty
      let changes = result.changes || []
      let B = changes.map(this.deserializeChange)
      let a = this.deserializeChange(change)
      // transform changes
      DocumentChange.transformInplace(a, B)
      let ops = B.reduce(function(ops, change) {
        return ops.concat(change.ops)
      }, [])
      let serverChange = new DocumentChange(ops, {}, {})

      cb(null, {
        change: this.serializeChange(a),
        serverChange: this.serializeChange(serverChange),
        version: result.version
      })
    }.bind(this))
  }

  /*
    Collaborator leaves a document editing session

    NOTE: This method is synchronous
  */
  disconnect(args) {
    this._unregister(args.collaboratorId, args.documentId)
  }

  /*
    To JSON
  */
  serializeChange(change) {
    return change.toJSON()
  }

  /*
    From JSON
  */
  deserializeChange(serializedChange) {
    let ch = DocumentChange.fromJSON(serializedChange)
    return ch
  }

}

export default CollabEngine
