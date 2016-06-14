"use strict";
/* global WeakMap */

var oo = require('../util/oo');
var uuid = require('../util/uuid');
var EventEmitter = require('../util/EventEmitter');

/**
  Server

  Implements a generic layered architecture
*/
function Server(config) {
  Server.super.apply(this);

  this.config = config;
  this._onConnection = this._onConnection.bind(this);
}

Server.Prototype = function() {

  this.bind = function(wss) {
    if (this.wss) {
      throw new Error('Server is already bound to a websocket');
    }
    this.wss = wss;
    this._connections = new WeakMap();
    this._collaborators = {};
    this.wss.on('connection', this._onConnection);

    var interval = this.config.heartbeat;
    if (interval) {
      this._heartbeat = setInterval(this._sendHeartbeat.bind(this), interval);
    }
    this._bound = true;
  };

  /*
    NOTE: This method is yet untested
  */
  this.unbind = function() {
    if (this._bound) {
      this.wss.off('connection', this._onConnection);
    } else {
      throw new Error('Server is not yet bound to a websocket.');
    }
  };

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
    req.setAuthenticated();
    this.next(req, res);
  };

  /*
    Stub implementation for authorize middleware

    Implement your own as a hook
  */
  this.authorize = function(req, res) {
    req.setAuthorized();
    this.next(req, res);
  };


  /*
    Ability to enrich the request data
  */
  this.enhanceRequest = function(req, res) {
    req.setEnhanced();
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
    res.setEnhanced();
    this.next(req, res);
  };

  /*
    When a new collaborator connects we generate a unique id for them
  */
  this._onConnection = function(ws) {
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
    When websocket connection closes
  */
  this._onClose = function(ws) {
    var conn = this._connections.get(ws);
    var collaboratorId = conn.collaboratorId;

    this.onDisconnect(collaboratorId);

    // Remove the connection records
    delete this._collaborators[collaboratorId];
    this._connections.delete(ws);
  };

  /*
    Implements state machine for handling the request response cycle

    __initial -        > authenticated      -> __authenticated, __error
    __authenticated   -> authorize          -> __authorized, __error
    __authorized      -> enhanceRequest     -> __requestEnhanced, __error
    __requestEnhanced -> execute            -> __executed, __error
    __executed        -> enhanceResponse    -> __enhanced, __error
    __enhanced        -> sendResponse       -> __done, __error
    __error           -> sendError          -> __done
    __done // end state
  */
  this.__initial = function(req, res) {
    return !req.isAuthenticated && !req.isAuthorized && !res.isReady;
  };

  this.__authenticated = function(req, res) {
    return req.isAuthenticated && !req.isAuthorized && !res.isReady;
  };

  this.__authorized = function(req, res) {
    return req.isAuthenticated && req.isAuthorized && !req.isEnhanced && !res.isReady;
  };

  this.__requestEnhanced = function(req, res) {
    return req.isAuthenticated && req.isAuthorized && req.isEnhanced && !res.isReady;
  };

  this.__executed = function(req, res) {
    // excecute must call res.send() so res.data is set
    return req.isAuthenticated && req.isAuthorized && res.isReady && res.data && !res.isEnhanced;
  };

  this.__enhanced = function(req, res) {
    return res.isReady && res.isEnhanced && !res.isSent;
  };

  this.__error = function(req, res) {
    return res.err && !res.isSent;
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
      this.enhanceRequest(req, res);
    } else if (this.__requestEnhanced(req, res)) {
      this.execute(req, res);
    } else if (this.__executed(req, res)) {
      this.enhanceResponse(req, res);
    } else if (this.__enhanced(req, res)) {
      this.sendResponse(req, res);
    } else if (this.__error(req, res)) {
      this.sendError(req, res);
    } else if (this.__done(req,res)) {
      // console.log('We are done with processing the request.');
    }
  };

  /*
    Send error response
  */
  this.sendError = function(req, res) {
    var collaboratorId = req.message.collaboratorId;
    var msg = res.err;
    this.send(collaboratorId, msg);
    res.setSent();
    this.next(req, res);
  };

  /*
    Sends a heartbeat message to all connected collaborators
  */
  this._sendHeartbeat = function() {
    Object.keys(this._collaborators).forEach(function(collaboratorId) {
      this.send(collaboratorId, {
        type: 'highfive',
        scope: '_internal'
      });
    }.bind(this));
  };

  /*
    Send response
  */
  this.sendResponse = function(req, res) {
    var collaboratorId = req.message.collaboratorId;
    this.send(collaboratorId, res.data);
    res.setSent();
    this.next(req, res);
  };

  this._isWebsocketOpen = function(ws) {
    return ws && ws.readyState === 1;
  };

  /*
    Send message to collaborator
  */
  this.send = function(collaboratorId, message) {
    if (!message.scope && this.config.scope) {
      message.scope = this.config.scope;
    }

    var ws = this._collaborators[collaboratorId].connection;
    if (this._isWebsocketOpen(ws)) {
      ws.send(this.serializeMessage(message));
    } else {
      console.error('Server#send: Websocket for collaborator', collaboratorId, 'is no longer open', message);
    }
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

    if (msg.scope === this.scope) {
      // We attach a unique collaborator id to each message
      msg.collaboratorId = conn.collaboratorId;
      var req = new ServerRequest(msg, ws);
      this._processRequest(req);
    }
  };

  this.serializeMessage = function(msg) {
    return JSON.stringify(msg);
  };

  this.deserializeMessage = function(msg) {
    return JSON.parse(msg);
  };

};

EventEmitter.extend(Server);

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
    Marks a request as authorized (authorizationData is optional)
  */
  this.setAuthorized = function(authorizationData) {
    this.isAuthorized = true;
    this.authorizationData = authorizationData;
  };

  /*
    Sets the isEnhanced flag
  */
  this.setEnhanced = function() {
    this.isEnhanced = true;
  };
};

oo.initClass(ServerRequest);

/*
  ServerResponse
*/
function ServerResponse() {
  this.isReady = false; // once the response has been set using send
  this.isEnhanced = false; // after response has been enhanced by enhancer
  this.isSent = false; // after response has been sent
  this.err = null;
  this.data = null;
}

ServerResponse.Prototype = function() {

  /*
    Sends an error response

    @example

    ```js
    res.error({
      type: 'syncError',
      errorName: 'AuthenticationError',
      documentId: 'doc-1'
    });
    ```
  */
  this.error = function(err) {
    this.err = err;
    this.isReady = true;
  };

  /*
    Send response data
  */
  this.send = function(data) {
    this.data = data;
    this.isReady = true;
  };

  /*
    Sets the isEnhanced flag
  */
  this.setEnhanced = function() {
    this.isEnhanced = true;
  };

  this.setSent = function() {
    this.isSent = true;
  };
};

oo.initClass(ServerResponse);

module.exports = Server;
