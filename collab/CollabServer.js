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
    this.collabEngine
  };

};

EventEmitter.extend(CollabServer);
module.exports = CollabServer;
