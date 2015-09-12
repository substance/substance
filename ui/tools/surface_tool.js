'use strict';

var OO = require('../../basics/oo');
var Tool = require('./tool');

/**
 * Abstract class for tools that interact with the selection of active surface.
 * A surfaceManager context must be provided via dependency injection.
 */

function SurfaceTool() {
  Tool.apply(this, arguments);
  
  this.surfaceManager = this.context.surfaceManager;
  
  // NOTE: We were doing this in a debounced way but that leads to edge cases.
  // E.g. When toggling a new link, the tool state gets immediately updated
  // to show the edit prompt, but afterwards the delayed selection:change event
  // immediately leads to a close of the prompt. We will observe tool performance
  // propagating each selection:changed event immediately.
  // We could also throttle
  this.surfaceManager.on('selection:changed', this.update, this);
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
