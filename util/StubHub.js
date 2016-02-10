
var CollabHub = require('./CollabHub');

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

};

CollabHub.extend(StubHub);

module.exports = StubHub;
