'use strict';

var Substance = require('../../basics');

var Command = function(controller) {
  this.controller = controller;
};

Command.Prototype = function() {

  this.getSurface = function() {
    return this.controller.getSurface();
  };

  this.getSelection = function() {
    return this.controller.getSelection();
  };

  // Needed for container annos
  this.getContainerId = function() {
    return this.controller.getContainerId();
  };

  this.getController = function() {
    return this.controller;
  };

  this.getDocument = function() {
    return this.controller.getDocument();
  };

  this.execute = function() {
    throw new Error('execute must be implemented by custom commands');
  };
};

Substance.initClass(Command);

module.exports = Command;