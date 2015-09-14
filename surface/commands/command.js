'use strict';

var Substance = require('../../basics');

var Command = function(surface) {
  this.surface = surface;
};

Command.Prototype = function() {

  this.getSurface = function() {
    return this.surface;
  };

  this.getDocument = function() {
    return this.surface.getDocument();
  };

  this.execute = function() {
    throw new Error('execute not implemented');
  };
};

Substance.initClass(Command);

module.exports = Command;