'use strict';

var Surface = require('../../../ui/Surface');

function StubSurface(doc, sel, containerId) {

  this.containerId = containerId || 'main';
  this.name = 'test_surface';
  this.selection = sel;

  this.getName = function() {
    return this.name;
  };

  this.getDocument = function() {
    return doc;
  };

  this.getSelection = function() {
    return this.selection;
  };

  this.setSelection = function(sel) {
    this.selection = sel;
  };

  this.getContainerId = function() {
    return this.containerId;
  };

  this.transaction = Surface.prototype.transaction;
}

module.exports = StubSurface;
