'use strict';

var oo = require('../util/oo');
var Command = require('./Command');

/**
  A class for commands intended to be executed on the {@link module:ui.Controller}
  level. See the example below to learn how to define a custom `ControllerCommand`.

  @class
  @extends ui/Command

  @constructor
  @param {ui/Controller} controller The controller the command will operate on

  @example

  ```js
  var ControllerCommand = require('substance/ui/commands').ControllerCommand;
  var Save = Command.extend({
    static: {
      name: 'save'
    },

    execute: function() {
      this.getController().saveDocument();
    }
  });
  ```
 */
var ControllerCommand = function(controller) {
  this.controller = controller;
};

ControllerCommand.Prototype = function() {

  /**
    Get controller instance

    @return {ui/Controller} The controller instance
   */
  this.getController = function() {
    return this.controller;
  };

  /**
    Get document instance

    @return {data/Document} The document instance owned by the controller
   */
  this.getDocument = function() {
    return this.controller.getDocument();
  };

  /**
    Execute command

    @return {object} info object with execution details
   */
  this.execute = function() {
    throw new Error('execute must be implemented by custom commands');
  };
};

oo.inherit(ControllerCommand, Command);

module.exports = ControllerCommand;
