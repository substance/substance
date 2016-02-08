'use strict';

var DocumentSession = require('./DocumentSession');
var WebSocket = require('../util/WebSocket');

/*
  Session that is connected to a Substance Hub allowing
  collaboration in real-time.

  TODO:
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
  this.nextCommit = null;
  this.ws = new WebSocket(this.messageQueue);

  this.ws.onopen = this._onConnected.bind(this);
  this.ws.onmessage = this._onMessage.bind(this);

  // Try to commit changes to the server every 1s
  setInterval(this.commit.bind(this), 1000);
}

CollabSession.Prototype = function() {
  var _super = Object.getPrototypeOf(this);

  /*
    Send local changes to the world.
  */
  this.commit = function() {
    // If there is something to commit and there is no commit pending
    if (this.nextCommit && !this._committing) {
      // console.log('committing', this.nextCommit);
      this.ws.send(['commit', this.nextCommit, this.doc.version]);

      this._pendingCommit = this.nextCommit;
      this.nextCommit = null;
      this._committing = true;
    }
  };

  /*
    We record all local changes into a single change (aka commit) that
  */
  this._recordCommit = function(change) {
    if (!this.nextCommit) {
      this.nextCommit = change;
    } else {
      // Merge new change into nextCommit
      this.nextCommit.ops = this.nextCommit.ops.concat(change.ops);
      this.nextCommit.after = change.after;
    }
  };

  this.afterDocumentChange = function(change, info) {
    _super.afterDocumentChange.apply(this, arguments);

    // Record local chagnes into nextCommit
    if (!info.remote) {
      this._recordCommit(change);
    }
  };

  /*
    As soon as we are connected we attempt to open a document
  */
  this._onConnected = function() {
    console.log(this.ws.clientId, ': Opened connection. Attempting to open a doc session on the hub.');
    // TODO: we could provide a pending change, then we can reuse
    // the 'oncommit' behavior of the server providing rebased changes
    // This needs to be thought through...
    var pendingChange = null;
    if (pendingChange) {
      this._committing = true;
    }
    this.ws.send(['open', this.doc.id, this.doc.version, pendingChange]);
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
  this.openDone = function(serverVersion, changes) {
    if (this.doc.version !== serverVersion) {
      // There have been changes on the server since the doc was opened
      // the last time
      if (changes) {
        changes.forEach(function(change) {
          this._applyRemoteChange(change);
        }.bind(this));
      }
    }
    this.doc.version = serverVersion;
    console.log(this.ws.clientId, ': Open complete. Listening for remote changes ...');
  };

  /*
    Retrieved when a commit has been confirmed by the server
  */
  this.commitDone = function(version, changes) {
    if (changes) {
      changes.forEach(function(change) {
        this._applyChange(change);
      }.bind(this));
    }
    this.doc.version = version;
    this._committing = false;
    console.log(this.ws.clientId, ': commit confirmed by server. New version:', version);
  };

  /*
    We receive an update from the server
    As a client can only commit one change at a time
    there is also only one update at a time.
  */
  this.update = function(version, change) {
    this._applyRemoteChange(change);
    this.doc.version = version;
  };

};

DocumentSession.extend(CollabSession);

module.exports = CollabSession;
