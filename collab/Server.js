"use strict";

var EventEmitter = require('../util/EventEmitter');
var oo = require('../util/oo');
var uuid = require('../util/uuid');

/*
  ServerRequest
*/

function ServerRequest(message, ws) {
  this.message = message;
  this.ws = ws;
  this.isAuthenticated = false;
  this.isAuhorized = false;
}

ServerRequest.Prototype = function() {
  /*
    Marks a request as authenticated
  */  
  this.setAuthenticated = function(session) {
    this.isAuthenticated = true;
    this.session = session;
  };

  /*
    Marks a request as authorized

    authorizationData is optional
  */
  this.setAuthorized = function(authorizationData) {
    this.isAuthorized = true;
    this.authorizationData = authorizationData;
  };
};

oo.initClass(ServerRequest);

/*
  ServerResponse
*/
function ServerResponse() {
  this.isReady = false; // once the response has been set using send
  this.isEnhanced = false; // after response has been enhanced by enhancer
  this.error = null;
}

ServerResponse.Prototype = function() {
  
  /*
    Sends an error response
  */
  this.error = function(error) {
    this.error = error;
    this.isReady = true;
  };

  /*
    Send response data
  */
  this.send = function(data) {
    this.data = data;
  };
};

oo.initClass(ServerResponse);

/**
  Server

  Implements a generic layered architecture
*/
function Server(config) {
  Server.super.apply(this);
  this.wss = config.wss;

  this._onConnection = this._onConnection.bind(this);
  this.wss.on('connection', this._onConnection);
  this._connections = new WeakMap();
}

Server.Prototype = function() {

  /*
    Hook called when a collaborator connects
  */
  this.onConnection = function(/*collaboratorId*/) {
    // noop
  };

  /*
    Hook called when a collaborator disconnects
  */
  this.onDisconnect = function(/*collaboratorId*/) {
    // noop
  };

  /*
    Stub implementation for authenticate middleware.

    Implement your own as a hook
  */
  this.authenticate = function(req, res) {
    this.req.setAuthenticated();
    this.next(req, res);
  };

  /*
    Stub implementation for authorize middleware

    Implement your own as a hook
  */
  this.authorize = function(req, res) {
    this.req.setAuthorized();
    this.next(req, res);
  };

  /*
    Executes the API according to the message type

    Implement your own as a hook
  */
  this.execute = function(/*req, res*/) {
    throw new Error('This method needs to be specified');
  };

  /*
    Ability to enrich the response data
  */
  this.enhanceResponse = function(req, res) {
    this.next(req, res);
  };

  /*
    When a new collaborator connects we generate a unique id for them
  */
  this._onConnection = function(ws) {
    var collaboratorId = uuid();

    var connection = {
      collaboratorId: collaboratorId
    };

    this._connections.set(ws, connection);

    // Mapping to find connection for collaboratorId
    this._collaborators[collaboratorId] = {
      connection: ws
    };

    ws.on('message', this._onMessage.bind(this, ws));
    ws.on('close', this._onClose.bind(this, ws));
  };

  /*
    When connection closes
  */
  this._onClose = function(ws) {
    var conn = this._connections.get(ws);
    var collaboratorId = conn.collaboratorId;

    this.onDisconnect(collaboratorId);
    
    // Remove the connection record
    delete this._collaborators[collaboratorId];
    this._connections.delete(ws);
  };

  // Implements state machine for handling the request response cycle
  // 
  // __initial -        > authenticated      -> __authenticated, __error
  // __authenticated   -> authorize          -> __authorized, __error
  // __authorized      -> execute            -> __executed, __error
  // __executed        -> enhanceResponse    -> __enhanced, __error
  // __enhanced        -> sendResponse       -> __done, __error
  // __error           -> sendError          -> __done
  // __done // end state

  this.__initial = function(req, res) {
    return !req.isAuthenticated && !req.isAuthorized && !res.isReady;
  };

  this.__authenticated = function(req, res) {
    return req.isAuthenticated && !req.isAuthorized && !res.isReady;
  };

  this.__authorized = function(req, res) {
    return req.isAuthenticated && req.isAuthorized && !res.isReady;
  };

  this.__error = function(req, res) {
    return res.error;
  };

  this.__enhanced = function(req, res) {
    return res.isReady && res.isEnhanced && !res.isSent;
  };

  this.__done = function(req, res) {
    return res.isSent;
  };

  this.next = function(req, res) {
    if (this.__initial(req, res)) {
      this.authenticate(req, res);
    } else if (this.__authenticated(req, res)) {
      this.authorize(req, res);
    } else if (this.__authorized(req, res)) {
      this.execute(req, res);
    } else if (this.__executed(req, res)) {
      this.enhanceResponse(req, res);
    } else if (this.__enhanced) {
      this.sendResponse(req, res);
    } else if (this.__error(req, res)) {
      this.sendError(req, res);
    } else if (this.__done(req,res)) {
      console.log('We are done with processing the request.');
    }
  };

  this.sendError = function(req, res) {
    var collaboratorId = req.message.collaboratorId;
    var msg = {
      type: 'error',
      errorMessage: res.error.message,
      requestMessage: req.message
    };
    this.send(collaboratorId, msg);
  };

  this.sendResponse = function(req, res) {
    
  }

  /*
    Send message to collaborator
  */
  this.send = function(collaboratorId, message) {
    var ws = this._collaborators[collaboratorId];
    ws.send(this.serializeMessage(message));
  };

  /*
    Send message to collaborator
  */
  this.broadCast = function(collaborators, message) {
    collaborators.forEach(function(collaboratorId) {
      this.send(collaboratorId, message);
    }.bind(this));
  };

  // Takes a request object
  this._processRequest = function(req) {
    var res = new ServerResponse();
    this.next(req, res);
  };

  /*
    Handling of client messages.

    Message comes in in the following format:

    We turn this into a method call internally:

    this.open(ws, 'doc13')

    The first argument is always the websocket so we can respond to messages
    after some operations have been performed.
  */
  this._onMessage = function(ws, msg) {
    // Retrieve the connection data
    var conn = this._connections.get(ws);
    msg = this.deserializeMessage(msg);

    // We attach a unique collaborator id to each message
    msg.collaboratorId = conn.collaboratorId;

    var req = new ServerRequest(msg, ws);
    this._processRequest(req);
  };

  this.serializeMessage = function(msg) {
    return JSON.stringify(msg);
  };

  this.deserializeMessage = function(msg) {
    return JSON.parse(msg);
  };

};

EventEmitter.extend(Server);

module.exports = Server;
