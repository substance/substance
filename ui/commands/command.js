'use strict';

var Substance = require('../../basics');

var Command = function(controller) {
  this.controller = controller;
};

Command.Prototype = function() {

  this.getSurface = function() {
    return this.controller.getSurface();
  };

  this.getController = function() {
    return this.controller;
  };

  this.getDocument = function() {
    return this.controller.getDocument();
  };

  this.execute = function() {
    throw new Error('execute not implemented');
  };
};

Substance.initClass(Command);

module.exports = Command;