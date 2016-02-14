
var CollabHub = require('./CollabHub');
var CollabSession = require('../model/StubCollabSession');

function StubHub() {
  StubHub.super.apply(this, arguments);
}

StubHub.Prototype = function() {

  this.serializeMessage = function(msg) {
    return msg;
  };

  this.deserializeMessage = function(msg) {
    return msg;
  };

  this.serializeChange = CollabSession.prototype.serializeChange;
  this.deserializeChange = CollabSession.prototype.deserializeChange;

};

CollabHub.extend(StubHub);

module.exports = StubHub;
