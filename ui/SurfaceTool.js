'use strict';

var Tool = require('./Tool');

/**
  Abstract class for tools that interact with the selection of active surface.
  Needs to be instantiated inside a {@link ui/Controller} context.
  
  @class
  @component
  @abstract
  @extends ui/Tool

  @example
  
  ```js
  var SurfaceTool = require('substance/ui/SurfaceTool');
  function InsertImageTool() {
    InsertImageTool.super.apply(this, arguments);
  }
  SurfaceTool.extend(InsertImageTool);
  InsertImageTool.static.name = 'insertImage';
  InsertImageTool.static.command = 'insertImage';
  ```
*/
function SurfaceTool() {
  SurfaceTool.super.apply(this, arguments);
}

SurfaceTool.Prototype = function() {

  var _super = Object.getPrototypeOf(this);

  /**
    Get command associated with the tool, based on the focused surface
  */
  this.getCommand = function() {
    var ctrl = this.getController();
    var surface = ctrl.getFocusedSurface();
    if (!surface) return;

    var commandName = this.constructor.static.command;
    if (commandName) {
      return surface.getCommand(commandName);
    } else {
      throw new Error('Contract: AnnotationTool.static.command should be associated to a supported command.');
    }
  };

  /**
    Unbinds event handler before getting unmounted.
    
    Custom tool implementation must do a super call.
  */
  this.dispose = function() {
    _super.dispose.call(this);

    var ctrl = this.getController();
    ctrl.disconnect(this);
  };

  /**
    Return the currently focused surface
    
    @return {ui/Surface}
  */
  this.getSurface = function() {
    return this.getController().getFocusedSurface();
  };

  /**
    Return the document associated with the focused surface.
    
    @return {model/Document}
  */
  this.getDocument = function() {
    return this.getController().getDocument();
  };

  /**
    Return the currently active container
    
    @return {Document.Container}
    @public
  */
  this.getContainer = function() {
    var surface = this.getSurface();
    if (surface) {
      return surface.getContainer();
    }
  };

  /**
    Executes the associated command
  */
  this.performAction = function() {
    var surface = this.getSurface();
    surface.executeCommand(this.constructor.static.command);
  };
};

Tool.extend(SurfaceTool);
module.exports = SurfaceTool;
