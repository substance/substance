'use strict';

var DocumentSession = require('./DocumentSession');
var WebSocket = require('../util/WebSocket');

/*
  Session that is connected to a Substance Hub allowing
  collaboration in real-time.

  TODO:
    - is 'commit' a good terminology? should we just call it update which
      works in both directions
    - error handling strategies
      - e.g. a commit message never gets through to the server
         - how to detect those errors? timeout?
         - how to handle them?
           - resend same commit?
           - just include affected changes with the next regular commit?
*/
function CollabSession(doc, options) {
  CollabSession.super.call(this, doc, options);

  // TODO: The CollabSession or the doc needs to be aware of a doc id
  // that corresponds to the doc on the server. For now we just
  // store it on the document instance.
  this.doc.id = 'doc-15';

  // TODO: Also we need to somehow store a version number (local version)
  this.doc.version = 1;

  this.messageQueue = options.messageQueue;
  this.pendingChanges = [];
  this.ws = new WebSocket(this.messageQueue);

  this.ws.onopen = this._onConnected.bind(this);
  this.ws.onmessage = this._onMessage.bind(this);
}

CollabSession.Prototype = function() {

  var _super = Object.getPrototypeOf(this);

  this.afterDocumentChange = function(change, info) {
    _super.afterDocumentChange.apply(this, arguments);

    console.log('doc changed', change, info);

    // We only consider local changes here.
    if (info.remote) return;

    // this.pendingChanges.push(change);
    // We immediately commit each change for now. However we may want to have 
    // a mechanism for keeping track of pendingChanges and send them as one
    // batch of changes. This is also needed for offline scenarios.
    this.ws.send(['commit', change, this.doc.version]);
  };

  /*
    As soon as we are connected we attempt to open a document
  */
  this._onConnected = function() {
    console.log(this.ws.clientId, ': Opened connection. Attempting to open a doc session on the hub.');
    this.ws.send(['open', this.doc.id, this.doc.version]);
  };

  /*
    Handling of remote messages. 

    Message comes in in the following format:

    ['open', 'doc13']

    We turn this into a method call internally:

    this.open(ws, 'doc13')

    The first argument is always the websocket so we can respond to messages
    after some operations have been performed.
  */
  this._onMessage = function(data) {
    var method = data[0];
    var args = data.splice(1);

    // Call handler
    this[method].apply(this, args);
  };

  /*
    Apply a change to the document
  */
  this._applyRemoteChange = function(change) {
    this.stage._apply(change);
    this.doc._apply(change);
    this._transformLocalChangeHistory(change);
    // We need to notify the change listeners so the UI gets updated
    // We pass replay: false, so this does not become part of the undo
    // history.
    this._notifyChangeListeners(change, { replay: false, remote: true });
  };

  this._applyChange = function() {
    console.warn('DEPRECATED: use this._applyRemoteChange() instead');
    this._applyRemoteChange.apply(this, arguments);
  };

  /*
    Server has opened the document. The collab session is live from
    now on.
  */
  this.openDone = function(serverVersion, change) {
    if (this.doc.version !== serverVersion) {
      // There have been changes on the server since the doc was opened
      // the last time
      this._applyChange(change);
      this.doc.version = serverVersion;
    }
    console.log(this.ws.clientId, ': Open complete. Listening for remote changes ...');
  };

  /*
    Retrieved when a commit has been confirmed by the server
  */
  this.commitDone = function(version, change) {
    this.doc.version = version;
    if (change) {
      this._applyChange(change);
    }
    console.log(this.ws.clientId, ': commit confirmed by server. New version:', version);
  };

  /*
    We receive an update from the server
  */
  this.update = function(change, version) {
    this._applyChange(change);
    this.doc.version = version;
  };

};

DocumentSession.extend(CollabSession);

module.exports = CollabSession;
