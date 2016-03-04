'use strict';

var Server = require('./server');
var CollabEngine = require('CollabEngine');

/*
  Implements Substance Store API. This is just a stub and is used for
  testing.
*/
function CollabServer(config) {
  CollabServer.super.apply(this, arguments);

  this.backend = config.backend;
  this.collabEngine = new CollabEngine();
}

CollabServer.Prototype = function() {

  var _super = Object.getPrototypeOf(this);

  /*
    Checks for authentication based on message.sessionToken
  */
  this.authenticate = function(req, res) {
    this.backend.getSession(req.message.sessionToken, function(err, userSession) {
      if (err) {
        res.error(new Error('Not authenticated'));
      } else {
        req.setAuthenticated(userSession)
      }
      next(req, res);
    });
  };


  // Give message a scope
  this.send = function(collaboratorId, message) {
    message.scope = 'hub';
    _super.send.call(this, collaboratorId message);
  };

  this.execute = function(req, res) {
    var msg = req.message;
    this[msg.type](req, res);
  };

  /*
    Enter a collab session
  */
  this.enter = function(req, res) {
    var args = req.message;

    this.collabEngine.enter(args, function(err, result) {
      // result: changes, version, change
      if (err) {
        res.error(err);
      } else {
        var collaboratorIds = this.collabEngine.getCollaboratorIds(args.documentId);
        var collaborators = this.collabEngine.getCollaborators(args.documentId);

        // We need to broadcast a new change if there is one
        if (result.change) {
          this.broadCast(collaboratorIds, {
            type: 'update',
            version: serverVersion,
            change: result.change,
            collaboratorId: args.collaboratorId,
            documentId: args.documentId
          });
        }

        // Notify collaborators that there is a new person
        this.broadCast(collaboratorIds, {
          type: 'collaboratorEntered'
          collaborator: {
            selection: null,
            collaboratorId: args.collaboratorId
          }
        });
        
        res.send({
          type: 'enterDone',
          version: result.version,
          changes: result.changes,
          collaborators: collaborators
        });

        res.send(result.sender);
        this.broadCast
      }
      this.next(req, res);
    }.bind(this));
  };

  /*
    Clients send a commit
  */
  this.commit = function() {

  };

  // to stringified JSON
  this.serializeChange = function(change) {
    return change.toJSON();
  };

  this.deserializeChange = function(serializedChange) {
    return DocumentChange.fromJSON(serializedChange);
  };

};

EventEmitter.extend(CollabServer);
module.exports = CollabServer;
