'use strict';

var CollabHub = require('../../collab/CollabHub');
var TestCollabSession = require('./TestCollabSession');

function TestCollabHub() {
  TestCollabHub.super.apply(this, arguments);
}

TestCollabHub.Prototype = function() {

  this.serializeMessage = function(msg) {
    return msg;
  };

  this.deserializeMessage = function(msg) {
    return msg;
  };

  this.serializeChange = TestCollabSession.prototype.serializeChange;
  this.deserializeChange = TestCollabSession.prototype.deserializeChange;
};

CollabHub.extend(TestCollabHub);

module.exports = TestCollabHub;
