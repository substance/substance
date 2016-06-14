'use strict';

var Server = require('./Server');
var CollabEngine = require('./CollabEngine');
var Err = require('../util/SubstanceError');
var forEach = require('lodash/forEach');

/*
  Implements Substance CollabServer API.
*/
function CollabServer(config) {
  CollabServer.super.apply(this, arguments);

  this.scope = 'substance/collab';
  this.documentEngine = config.documentEngine;
  this.collabEngine = new CollabEngine(this.documentEngine);
}

CollabServer.Prototype = function() {
  var _super = CollabServer.super.prototype;

  /*
    Send an error
  */
  this._error = function(req, res, err) {
    res.error({
      type: 'error',
      error: {
        name: req.message.type+'Error',
        cause: {
          name: err.name
        }
      },
      // errorName: err.name,
      documentId: req.message.documentId
    });
    this.next(req, res);
  };

  /*
    Configurable authenticate method
  */
  this.authenticate = function(req, res) {
    if (this.config.authenticate) {
      this.config.authenticate(req, function(err, session) {
        if (err) {
          console.error(err);
          // Send the response with some delay
          this._error(req, res, new Err('AuthenticationError', {cause: err}));
          return;
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
          this._error(req, res, err);
          return;
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
    // console.log('CollabServer.onDisconnect ', collaboratorId);
    // All documents collaborator is currently collaborating to
    var documentIds = this.collabEngine.getDocumentIds(collaboratorId);
    documentIds.forEach(function(documentId) {
      this._disconnectDocument(collaboratorId, documentId);
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
    Client initiates a sync
  */
  this.sync = function(req, res) {
    var args = req.message;

    // console.log('CollabServer.connect', args.collaboratorId);

    // Takes an optional argument collaboratorInfo
    this.collabEngine.sync(args, function(err, result) {
      // result: changes, version, change
      if (err) {
        this._error(req, res, err);
        return;
      }

      // Get enhance collaborators (e.g. including some app-specific user-info)
      var collaborators = this.collabEngine.getCollaborators(args.documentId, args.collaboratorId);

      // Send the response
      res.send({
        scope: this.scope,
        type: 'syncDone',
        documentId: args.documentId,
        version: result.version,
        serverChange: result.serverChange,
        collaborators: collaborators
      });

      // We need to broadcast a new change if there is one
      // console.log('CollabServer.connect: update is broadcasted to collaborators', Object.keys(collaborators));
      forEach(collaborators, function(collaborator) {
        this.send(collaborator.collaboratorId, {
          scope: this.scope,
          type: 'update',
          documentId: args.documentId,
          version: result.version,
          change: result.change,
          // collaboratorId: args.collaboratorId,
          // All except of receiver record
          collaborators: this.collabEngine.getCollaborators(args.documentId, collaborator.collaboratorId)
        });
      }.bind(this));
      this.next(req, res);
    }.bind(this));
  };

  /*
    Expcicit disconnect. User wants to exit a collab session.
  */
  this.disconnect = function(req, res) {
    var args = req.message;
    var collaboratorId = args.collaboratorId;
    var documentId = args.documentId;
    this._disconnectDocument(collaboratorId, documentId);
    // Notify client that disconnect has completed successfully
    res.send({
      scope: this.scope,
      type: 'disconnectDone',
      documentId: args.documentId
    });
    this.next(req, res);
  };

  this._disconnectDocument = function(collaboratorId, documentId) {
    var collaboratorIds = this.collabEngine.getCollaboratorIds(documentId, collaboratorId);

    var collaborators = {};
    collaborators[collaboratorId] = null;

    this.broadCast(collaboratorIds, {
      type: 'update',
      documentId: documentId,
      // Removes the entry
      collaborators: collaborators
    });
    // Exit from each document session
    this.collabEngine.disconnect({
      documentId: documentId,
      collaboratorId: collaboratorId
    });
  };

};

Server.extend(CollabServer);
module.exports = CollabServer;
