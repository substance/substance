import EventEmitter from '../util/EventEmitter'
import forEach from 'lodash/forEach'
import map from 'lodash/map'
import extend from 'lodash/extend'
import DocumentChange from '../model/DocumentChange'
import Selection from '../model/Selection'
import { fromJSON as selFromJSON } from '../model/selectionHelpers'
import Err from '../util/SubstanceError'

/*
  Engine for realizing collaborative editing. Implements the server-methods of
  the real time editing as a reusable library.
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
  _register(collaboratorId, documentId, selection, collaboratorInfo) {
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
    collaborator.documents[documentId] = {
      selection: selection
    }
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

  _updateSelection(collaboratorId, documentId, sel) {
    let docEntry = this._collaborators[collaboratorId].documents[documentId]
    docEntry.selection = sel
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
          selection: doc.selection,
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
  };

  /*
    Client starts a sync

    @param args.documentId
    @param args.version The client's document version (0 if client starts with an empty doc)
    @param args.change pending client change

    Note: a client can reconnect having a pending change
    which is similar to the commit case
  */
  sync(args, cb) {
    // We now always get a change since the selection should be considered
    this._sync(args, function(err, result) {
      if (err) return cb(err)
      // Registers the collaborator If not already registered for that document
      this._register(args.collaboratorId, args.documentId, result.change.after.selection, args.collaboratorInfo)
      cb(null, result)
    }.bind(this))
  }

  /*
    Internal implementation of sync

    @param {String} args.collaboratorId collaboratorId
    @param {String} args.documentId document id
    @param {Number} args.version client version
    @param {Number} args.change new change

    OUT: version, changes, version
  */
  _sync(args, cb) {
    // Get latest doc version
    this.documentEngine.getVersion(args.documentId, function(err, serverVersion) {
      if (serverVersion === args.version) { // Fast forward update
        this._syncFF(args, cb)
      } else if (serverVersion > args.version) { // Client changes need to be rebased to latest serverVersion
        this._syncRB(args, cb)
      } else {
        cb(new Err('InvalidVersionError', {
          message: 'Client version greater than server version'
        }))
      }
    }.bind(this))
  }

  /*
    Update all collaborators selections of a document according to a given change

    WARNING: This has not been tested quite well
  */
  _updateCollaboratorSelections(documentId, change) {
    // By not providing the 2nd argument to getCollaborators the change
    // creator is also included.
    let collaborators = this.getCollaborators(documentId)

    forEach(collaborators, function(collaborator) {
      if (collaborator.selection) {
        let sel = selFromJSON(collaborator.selection)
        change = this.deserializeChange(change)
        sel = DocumentChange.transformSelection(sel, change)
        // Write back the transformed selection to the server state
        this._updateSelection(collaborator.collaboratorId, documentId, sel.toJSON())
      }
    }.bind(this))
  }

  /*
    Fast forward sync (client version = server version)
  */
  _syncFF(args, cb) {
    this._updateCollaboratorSelections(args.documentId, args.change)

    // HACK: On connect we may receive a nop that only has selection data.
    // We don't want to store such changes.
    // TODO: it would be nice if we could handle this in a different
    // branch of connect, so we don't spoil the commit implementation
    if (args.change.ops.length === 0) {
      return cb(null, {
        change: args.change,
        // changes: [],
        serverChange: null,
        version: args.version
      })
    }

    // Store the commit
    this.documentEngine.addChange({
      documentId: args.documentId,
      change: args.change,
      documentInfo: args.documentInfo
    }, function(err, serverVersion) {
      if (err) return cb(err);
      cb(null, {
        change: args.change, // collaborators must be notified
        serverChange: null,
        // changes: [], // no changes missed in fast-forward scenario
        version: serverVersion
      })
    })
  }

  /*
    Rebased sync (client version < server version)
  */
  _syncRB(args, cb) {
    this._rebaseChange({
      documentId: args.documentId,
      change: args.change,
      version: args.version
    }, function(err, rebased) {
      // result has change, changes, version (serverversion)
      if (err) return cb(err)

      this._updateCollaboratorSelections(args.documentId, rebased.change)

      // HACK: On connect we may receive a nop that only has selection data.
      // We don't want to store such changes.
      // TODO: it would be nice if we could handle this in a different
      // branch of connect, so we don't spoil the commit implementation
      if (args.change.ops.length === 0) {
        return cb(null, {
          change: rebased.change,
          serverChange: rebased.serverChange,
          version: rebased.version
        })
      }

      // Store the rebased commit
      this.documentEngine.addChange({
        documentId: args.documentId,
        change: rebased.change, // rebased change
        documentInfo: args.documentInfo
      }, function(err, serverVersion) {
        if (err) return cb(err)
        cb(null, {
          change: rebased.change,
          serverChange: rebased.serverChange, // collaborators must be notified
          version: serverVersion
        })
      })
    }.bind(this))
  }

  /*
    Rebase change

    IN: documentId, change, version (change version)
    OUT: change, changes (server changes), version (server version)
  */
  _rebaseChange(args, cb) {
    this.documentEngine.getChanges({
      documentId: args.documentId,
      sinceVersion: args.version
    }, function(err, result) {
      let B = result.changes.map(this.deserializeChange)
      let a = this.deserializeChange(args.change)
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
