'use strict';

var OO = require('../../basics/oo');
var Command = require('./command');

var ControllerCommand = function(controller) {
  this.controller = controller;
};

ControllerCommand.Prototype = function() {

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

OO.inherit(ControllerCommand, Command);

module.exports = ControllerCommand;