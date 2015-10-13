'use strict';

var OO = require('../../basics/oo');
var Command = require('./command');

/**
 * A class for commands intended to be executed on the {@link module:ui.Controller}
 * level. See the example below to learn how to define a custom `ControllerCommand`.
 *
 * @constructor
 * @param {module:ui.Controller} controller The controller the command will operate on
 * @class
 * @extends module:ui/commands.Command
 * @memberof module:ui/commands
 * @example
 * 
 * var ControllerCommand = require('substance/ui/commands').ControllerCommand;
 * var Save = Command.extend({
 *   static: {
 *     name: 'save'
 *   },
 * 
 *   execute: function() {
 *     this.getController().saveDocument();
 *   }
 * });
 */

var ControllerCommand = function(controller) {
  this.controller = controller;
};

ControllerCommand.Prototype = function() {

  /**
   * Get controller instance
   *
   * @return {module:ui.Controller} The controller instance
   * @method getController
   * @memberof module:ui/commands.ControllerCommand.prototype
   */
  this.getController = function() {
    return this.controller;
  };

  /**
   * Get document instance
   *
   * @return {module:document.Document} The document instance owned by the controller
   * @method getDocument
   * @memberof module:ui/commands.ControllerCommand.prototype
   */
  this.getDocument = function() {
    return this.controller.getDocument();
  };

  /**
   * Execute command
   *
   * @return {object} info object with execution details
   * @memberof module:ui/commands.ControllerCommand.prototype
   */
  this.execute = function() {
    throw new Error('execute must be implemented by custom commands');
  };
};

OO.inherit(ControllerCommand, Command);

module.exports = ControllerCommand;