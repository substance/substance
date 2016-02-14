
var isString = require('lodash/isString');
var CollabSession = require('./CollabSession');
var DocumentChange = require('./DocumentChange');


function StubCollabSession() {
  StubCollabSession.super.apply(this, arguments);
}

StubCollabSession.Prototype = function() {

  this.serializeMessage = function(msg) {
    if (this.ws._isSimulated) {
      return msg;
    } else {
      return JSON.stringify(msg);
    }
  };

  this.deserializeMessage = function(msg) {
    if (this.ws._isSimulated) {
      return msg;
    } else {
      return JSON.parse(msg);
    }
  };

  this.serializeChange = function(change) {
    if (change instanceof DocumentChange) {
      return change.toJSON();
    } else {
      return change;
    }
  };

  this.deserializeChange = function(data) {
    if (data instanceof DocumentChange) {
      return data;
    } else if (isString(data)) {
      return DocumentChange.fromJSON(JSON.parse(data));
    } else {
      return DocumentChange.fromJSON(data);
    }
  };

};

CollabSession.extend(StubCollabSession);

module.exports = StubCollabSession;