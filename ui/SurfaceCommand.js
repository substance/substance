'use strict';

var oo = require('../util/oo');
var Command = require('./Command');

/**
  A class for commands intended to be executed on the {@link module:ui.surface.Surface}
  level. See the example below to learn how to define a custom `SurfaceCommand`.

  @class
  @param {ui/Surface} surface The surface the command will operate on
  @extends ui/Command

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
var SurfaceCommand = function(surface) {
  this.surface = surface;
};

SurfaceCommand.Prototype = function() {
  /**
    Get Surface instance

    @return {ui/Surface} The surface instance
   */
  this.getSurface = function() {
    return this.surface;
  };

  /**
    Get current selection of surface bound to the command

    @return {model/Selection} the current Document.Selection derived from the surface.
   */
  this.getSelection = function() {
    var surface = this.getSurface();
    return surface.getSelection();
  };

  /**
    Get containerId. Only available on container surfaces, e.g. {@link module:ui.surface.ContainerEditor}.

    @return {String} the container id
   */
  this.getContainerId = function() {
    var surface = this.getSurface();
    return surface.getContainerId();
  };

  /**
    Get the current document

    @return {data/Document} the container id
   */
  this.getDocument = function() {
    var surface = this.getSurface();
    return surface.getDocument();
  };

  /**
    Execute the command. Needs to be implemented by the custom command class.

    @abstract
    @return {data/Document} The document instance owned by the controller
   */
  this.execute = function() {
    throw new Error('execute must be implemented by custom commands');
  };
};

oo.inherit(SurfaceCommand, Command);

module.exports = SurfaceCommand;