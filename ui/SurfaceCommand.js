'use strict';

var OO = require('../util/oo');
var Command = require('./Command');

/**
 * A class for commands intended to be executed on the {@link module:ui.surface.Surface}
 * level. See the example below to learn how to define a custom `SurfaceCommand`.
 *
 * @class
 * @param {module:ui.surface.Surface} surface The surface the command will operate on
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
var SurfaceCommand = function(surface) {
  this.surface = surface;
};

SurfaceCommand.Prototype = function() {
  /**
   * Get Surface instance
   *
   * @method getSurface
   * @return {module:ui.surface.Surface} The surface instance
   * @memberof module:ui/commands.SurfaceCommand.prototype
   */
  this.getSurface = function() {
    return this.surface;
  };

  /**
   * Get current selection of surface bound to the command
   *
   * @method getSelection
   * @return {module:document.Document.Selection} the current Document.Selection derived from the surface.
   * @memberof module:ui/commands.SurfaceCommand.prototype
   */
  this.getSelection = function() {
    var surface = this.getSurface();
    return surface.getSelection();
  };

  /**
   * Get containerId. Only available on container surfaces, e.g. {@link module:ui.surface.ContainerEditor}.
   *
   * @method getSelection
   * @return {String} the container id
   * @memberof module:ui/commands.SurfaceCommand.prototype
   */
  this.getContainerId = function() {
    var surface = this.getSurface();
    return surface.getContainerId();
  };

  /**
   * Get the current document
   *
   * @method getDocument
   * @return {module:document.Document} the container id
   * @memberof module:ui/commands.SurfaceCommand.prototype
   */
  this.getDocument = function() {
    var surface = this.getSurface();
    return surface.getDocument();
  };

  /**
   * Execute the command. Needs to be implemented by the custom command class.
   *
   * @return {module:document.Document} The document instance owned by the controller
   * @method execute
   * @abstract
   * @memberof module:ui/commands.SurfaceCommand.prototype
   */
  this.execute = function() {
    throw new Error('execute must be implemented by custom commands');
  };
};

OO.inherit(SurfaceCommand, Command);

module.exports = SurfaceCommand;