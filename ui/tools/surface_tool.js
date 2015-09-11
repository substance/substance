'use strict';

var OO = require('../../basics/oo');
var Tool = require('./tool');
var _ = require('../../basics/helpers');

/**
 * Abstract class for tools that interact with the selection of active surface.
 * A surfaceManager context must be provided via dependency injection.
 */

function SurfaceTool() {
  Tool.apply(this, arguments);
  
  this.surfaceManager = this.context.surfaceManager;

  this.onUpdateDebounced = _.debounce(this.update, 50);
  this.surfaceManager.on('selection:changed', this.onUpdateDebounced, this);
}

SurfaceTool.Prototype = function() {

  /**
   * Unbinds event handler before getting unmounted.
   *
   * Custom tool implementation must do a super call.
   */

  this.willUnmount = function() {
    this.surfaceManager.off('selection:changed', this.update);
  };

  /**
   * Updates the tool state when the selection changed.
   *
   * This must be overwritten by the tool implementation, analyzing the
   * selection and updating the tool state appropriately.
   * 
   * @param {Selection} sel
   * @param {Surface} surface
   * @public
   */

  this.update = function(/*sel, surface*/) {
    throw new Error('Must be defined by your tool implementation');
  };

  /**
   * Return the currently focused surface
   * 
   * @return {Surface}
   * @public
   */

  this.getSurface = function() {
    return this.surfaceManager.getFocusedSurface();
  };

  /**
   * Return the document associated with the focused surface.
   * 
   * @return {Document}
   * @public
   */

  this.getDocument = function() {
    var surface = this.getSurface();
    if (surface) {
      return surface.getDocument();
    }
  };

  /**
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
};

OO.inherit(SurfaceTool, Tool);
module.exports = SurfaceTool;
