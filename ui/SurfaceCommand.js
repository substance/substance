'use strict';

var Command = require('./Command');

/**
  A class for commands intended to be executed on the {@link ui/Surface}
  level. See the example below to learn how to define a custom `SurfaceCommand`.

  @class
  @abstract
  @extends ui/Command

  @example

  ```js
  var SurfaceCommand = require('substance/ui/SurfaceCommand');
  var uuid = require('substance/util/uuid');
  function InsertImageCommand() {
    SurfaceCommand.apply(this, arguments);
  }
  InsertImageCommand.Prototype = function() {
    this.getCommandState = function() {
      var sel = this.getSelection();
      var newState = { disabled: true, active: false };
      if (sel && !sel.isNull() && sel.isPropertySelection()) {
        newState.disabled = false;
      }
      return newState;
    };

    this.execute = function(imageSrc) {
      var surface = this.getSurface();

      surface.transaction(function(tx, args) {
        var newImage = {
          id: uuid("image"),
          type: "image",
          src: imageSrc
        };
        // Note: returning the result which will contain an updated selection
        return surface.insertNode(tx, { selection: args.selection, node: newImage });
      });
    };

  };
  SurfaceCommand.extend(InsertImageCommand);
  InsertImageCommand.static.name = 'insertImage';
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

    @return {model/Selection} the current document selection derived from the surface.
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

Command.extend(SurfaceCommand);

module.exports = SurfaceCommand;