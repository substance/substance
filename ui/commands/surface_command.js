'use strict';

var OO = require('../../basics/oo');
var Command = require('./command');

var SurfaceCommand = function(surface) {
  this.surface = surface;
};

SurfaceCommand.Prototype = function() {

  this.getSurface = function() {
    return this.getSurface();
  };

  this.getSelection = function() {
    var surface = this.getSurface();
    return surface.getSelection();
  };

  // Needed for container annos
  this.getContainerId = function() {
    var surface = this.getSurface();
    return surface.getContainerId();
  };

  this.getDocument = function() {
    var surface = this.getSurface();
    return surface.getDocument();
  };

  this.execute = function() {
    throw new Error('execute must be implemented by custom commands');
  };
};

OO.inherit(SurfaceCommand, Command);

module.exports = SurfaceCommand;