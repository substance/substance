'use strict';

var OO = require('../../basics/oo');
var Tool = require('./tool');
var _ = require('../../basics/helpers');
var Component = require('../component');
var $$ = Component.$$;

/**
 * Abstract class for tools that interact with the selection of active surface.
 * A surfaceManager context must be provided via dependency injection.
 */

function SurfaceTool() {
  Tool.apply(this, arguments);
}

SurfaceTool.Prototype = function() {

  /**
   * Binds event handler after getting mounted.
   *
   * Custom tool implementation must do a super call.
   */

  this.didMount = function() {
    // NOTE: We were doing this in a debounced way but that leads to edge cases.
    // E.g. When toggling a new link, the tool state gets immediately updated
    // to show the edit prompt, but afterwards the delayed selection:change event
    // immediately leads to a close of the prompt. We will observe tool performance
    // propagating each selection:changed event immediately.
    // We could also throttle
    this.context.surfaceManager.on('selection:changed', this.update, this);
  };

  /**
   * Unbinds event handler before getting unmounted.
   *
   * Custom tool implementation must do a super call.
   */

  this.willUnmount = function() {
    this.context.surfaceManager.off('selection:changed', this.update);
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

  this.update = function(sel, surface) {
    /* jshint unused:false*/
    throw new Error('Must be defined by your tool implementation');
  };

  /**
   * Return the currently focused surface
   *
   * @return {Surface}
   * @public
   */

  this.getSurface = function() {
    return this.context.surfaceManager.getFocusedSurface();
  };

  /**
   * Return the document associated with the focused surface.
   *
   * @return {Document}
   * @public
   */

  this.getDocument = function() {
    return this.context.surfaceManager.getDocument();
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

  this.onClick = function(e) {
    e.preventDefault();
  };

  this.onMouseDown = function(e) {
    e.preventDefault();
    if (this.state.disabled) {
      return;
    }
    this.performAction();
  };

  this.render = function() {
    var title = this.props.title || _.capitalize(this.getName());

    if (this.state.mode) {
      title = [_.capitalize(this.state.mode), title].join(' ');
    }

    var el = $$("button")
      .attr('title', title)
      .addClass('button tool')
      .on('mousedown', this.onMouseDown)
      .on('click', this.onClick);

    if (this.state.disabled) {
      el.addClass('disabled');
    }
    if (this.state.active) {
      el.addClass('active');
    }
    el.append(this.props.children);
    return el;
  };
};

OO.inherit(SurfaceTool, Tool);
module.exports = SurfaceTool;
