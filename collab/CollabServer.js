'use strict';

var Server = require('./Server');
var CollabEngine = require('./CollabEngine');
var extend = require('lodash/extend');
var each = require('lodash/each');

/*
  Implements Substance CollabServer API.
*/
function CollabServer(config) {
  CollabServer.super.apply(this, arguments);

  this.scope = 'substance/collab';
  this.documentEngine = config.documentEngine;
  this.collabEngine = new CollabEngine(this.documentEngine);

  // Here we store additional collaborator data
  this._collaboratorInfo = {};
}

CollabServer.Prototype = function() {
  var _super = CollabServer.super.prototype;

  this.getEnhancedCollaborators = function(documentId, collaboratorId) {
    var collaborators = this.collabEngine.getCollaborators(documentId, collaboratorId);
    each(collaborators, function(collaborator, collaboratorId) {
      var info = this._collaboratorInfo[collaboratorId];
      extend(collaborator, info, collaborator);
    }.bind(this));
    return collaborators;
  };

  this.enhanceCollaborator = function(req, cb) {
    if (this.config.enhanceCollaborator) {
      this.config.enhanceCollaborator(req, cb);
    } else {
      cb(null, {});
    }
  };

  /*
    Configurable authenticate method
  */
  this.authenticate = function(req, res) {
    if (this.config.authenticate) {
      this.config.authenticate(req, function(err, session) {
        if (err) {
          console.log('Request is not authenticated.');
          return res.error(err);
        }
        req.setAuthenticated(session);
        this.next(req, res);
      }.bind(this));
    } else {
      _super.authenticate.apply(this, arguments);
    }
  };

  /*
    Configureable enhanceRequest method
  */
  this.enhanceRequest = function(req, res) {
    if (this.config.enhanceRequest) {
      this.config.enhanceRequest(req, function(err) {
        if (err) {
          console.error('enhanceRequest returned an error', err);
          return res.error(err);
        }
        req.setEnhanced();
        this.next(req, res);
      }.bind(this));
    } else {
      _super.enhanceRequest.apply(this, arguments);
    }
  };

  /*
    Called when a collaborator disconnects
  */
  this.onDisconnect = function(collaboratorId) {
    console.log('CollabServer.onDisconnect ', collaboratorId);
    // All documents collaborator is currently collaborating to
    var documentIds = this.collabEngine.getDocumentIds(collaboratorId);
    documentIds.forEach(function(documentId) {
      var collaboratorIds = this.collabEngine.getCollaboratorIds(documentId, collaboratorId);
      this.broadCast(collaboratorIds, {
        type: 'collaboratorDisconnected',
        documentId: documentId,
        collaboratorId: collaboratorId
      });
      // Exit from each document session
      this.collabEngine.disconnect({
        documentId: documentId,
        collaboratorId: collaboratorId
      });
    }.bind(this));
  };

  /*
    Execute CollabServer API method based on msg.type
  */
  this.execute = function(req, res) {
    var msg = req.message;
    var method = this[msg.type];

    if (method) {
      method.call(this, req, res);
    } else {
      console.error('Method', msg.type, 'not implemented for CollabServer');
    }
  };

  /*
    Connect a new collab session based on documentId, version and maybe a pending change
  */
  this.connect = function(req, res) {
    var args = req.message;

    console.log('CollabServer.connect', args.collaboratorId);

    this.collabEngine.connect(args, function(err, result) {

      // result: changes, version, change
      if (err) return res.error(err);
      var collaboratorIds = this.collabEngine.getCollaboratorIds(args.documentId, args.collaboratorId);

      var collaborator = {
        selection: args.change.after.selection,
        collaboratorId: args.collaboratorId
      };

      // console.log('--------------- req.isAuthenticated', req.isAuthenticated);

      this.enhanceCollaborator(req, function(err, info) {
        if (!err && info) {
          collaborator = extend({}, info, collaborator);
          // Store info for each collaborator
          this._collaboratorInfo[args.collaboratorId] = info;
        }

        // Get enhance collaborators (e.g. including some app-specific user-info)
        var collaborators = this.getEnhancedCollaborators(args.documentId, args.collaboratorId);

        // Send the response
        res.send({
          type: 'connectDone',
          documentId: args.documentId,
          version: result.version,
          changes: result.changes,
          collaborators: collaborators
        });

        // We need to broadcast a new change if there is one
        console.log('CollabServer.connect: Client change is broadcasted', collaboratorIds);
        this.broadCast(collaboratorIds, {
          type: 'update',
          version: result.version,
          change: result.change,
          collaboratorId: args.collaboratorId,
           // we send collaborator object so the other parties can register them
          collaborator: collaborator,
          documentId: args.documentId
        });
      }.bind(this));
      this.next(req, res);
    }.bind(this));
  };

  /*
    Disconnect collab session
  */
  this.disconnect = function(req, res) {
    var args = req.message;
    this.collabEngine.exit({
      collaboratorId: args.collaboratorId,
      documentId: args.documentId
    }, function(err) {
      if (err) {
        res.error(err);
      }

      // Delete collaborator info object
      delete this._collaboratorInfo[args.collaboratorId];
      // Notify client that disconnect has completed successfully
      res.send({
        type: 'disconnectDone',
        documentId: args.documentId
      });
    }.bind(this));
  };

  /*
    Clients send a commit. Change will be applied on server and rebased
    if needed. Then the client 
  */
  this.commit = function(req, res) {
    var args = req.message;

    this.collabEngine.commit(args, function(err, result) {
      // result has changes, version, change
      if (err) {
        res.error(err);
      } else {
        var collaboratorIds = this.collabEngine.getCollaboratorIds(args.documentId, args.collaboratorId);

        // We need to broadcast the change to all collaborators
        this.broadCast(collaboratorIds, {
          type: 'update',
          version: result.version,
          change: result.change,
          collaboratorId: args.collaboratorId,
          documentId: args.documentId
        });

        // confirm the new commit, providing the diff (changes) since last common version
        res.send({
          documentId: args.documentId,
          type: 'commitDone',
          version: result.version,
          changes: result.changes          
        });
      }
      this.next(req, res);
    }.bind(this));
  };

  /*
    Clients sends a selection update
  */
  this.updateSelection = function(req/*, res*/) {
    var args = req.message;

    this.collabEngine.updateSelection(args, function(err, result) {
      if (err) {
        console.error('updateSelection error: ', err);
        // Selection updates are not that important, so we just do nothing here
        // TODO: think of a way to 'abort' a request without sending a response
        // res.error(err);
      } else {
        var collaboratorIds = this.collabEngine.getCollaboratorIds(args.documentId, args.collaboratorId);
        this.broadCast(collaboratorIds, {
          type: 'update',
          version: result.version,
          change: result.change,
          collaboratorId: args.collaboratorId,
          documentId: args.documentId     
        });
      }
    }.bind(this));
  };
};

Server.extend(CollabServer);
module.exports = CollabServer;
