'use strict';

var Substance = require('../../basics');

var Command = function(surface) {
  this.surface = surface;
};

Command.Prototype = function() {

  this.getSurface = function() {
    return this.surface;
  };

  this.getSelection = function() {
    return this.surface.getSelection();
  };

  // Needed for container annos
  this.getContainerId = function() {
    return this.surface.getContainerId();
  };

  this.getDocument = function() {
    return this.surface.getDocument();
  };

  this.execute = function() {
    throw new Error('execute must be implemented by custom commands');
  };
};

Substance.initClass(Command);

module.exports = Command;