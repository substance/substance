'use strict';

var oo = require('../util/oo');
var Tool = require('./Tool');

/*
 * 
 * Abstract class for tools that interact with the selection of active surface.
 * A surfaceManager context must be provided via dependency injection.
 * 
 * @class
 */

function SurfaceTool() {
  Tool.apply(this, arguments);
}

SurfaceTool.Prototype = function() {

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

  /*
   * Unbinds event handler before getting unmounted.
   *
   * Custom tool implementation must do a super call.
   */

  this.dispose = function() {
    var ctrl = this.getController();
    ctrl.disconnect(this);
  };

  /*
   * Return the currently focused surface
   *
   * @return {Surface}
   * @public
   */

  this.getSurface = function() {
    return this.getController().getFocusedSurface();
  };

  /*
   * Return the document associated with the focused surface.
   *
   * @return {Document}
   * @public
   */

  this.getDocument = function() {
    return this.getController().getDocument();
  };

  /*
   * Return the currently active container
   *
   * @return {Document.Container}
   * @public
   */

  this.getContainer = function() {
    var surface = this.getSurface();
    if (surface) {
      return surface.getContainer();
    }
  };

  this.performAction = function() {
    var surface = this.getSurface();
    surface.executeCommand(this.constructor.static.command);
  };

};

oo.inherit(SurfaceTool, Tool);
module.exports = SurfaceTool;
