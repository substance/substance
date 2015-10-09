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

  // NOTE: We were doing this in a debounced way but that leads to edge cases.
  // E.g. When toggling a new link, the tool state gets immediately updated
  // to show the edit prompt, but afterwards the delayed selection:change event
  // immediately leads to a close of the prompt. We will observe tool performance
  // propagating each selection:changed event immediately.
  // We could also throttle
  // var ctrl = this.getController();
  // ctrl.connect(this, {
  //   'selection:changed': this.update
  // });
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

  /**
   * Unbinds event handler before getting unmounted.
   *
   * Custom tool implementation must do a super call.
   */

  this.dispose = function() {
    var ctrl = this.getController();
    ctrl.disconnect(this);
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

  // this.update = function(sel, surface) {
  //   /* jshint unused:false*/
  //   throw new Error('Must be defined by your tool implementation');
  // };

  /**
   * Return the currently focused surface
   *
   * @return {Surface}
   * @public
   */

  this.getSurface = function() {
    return this.getController().getSurface();
  };

  /**
   * Return the document associated with the focused surface.
   *
   * @return {Document}
   * @public
   */

  this.getDocument = function() {
    return this.getController().getDocument();
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
    if (this.state.disabled) {
      return;
    }
    this.performAction();
  };

  this.performAction = function() {
    var surface = this.getSurface();
    surface.executeCommand(this.constructor.static.command);
  };

  this.render = function() {
    var title = this.props.title || this.i18n.t(this.getName());

    if (this.state.mode) {
      title = [_.capitalize(this.state.mode), title].join(' ');
    }

    var el = $$("button")
      .attr('title', title)
      .addClass('button tool')
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
