'use strict';

var oo = require('../util/oo');
var Tool = require('./Tool');
var _ = require('../util/helpers');
var Component = require('./Component');
var $$ = Component.$$;

/**
 * Abstract class for tools that interact with the selection of active surface.
 * A surfaceManager context must be provided via dependency injection.
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
   * Return the currently focused surface
   *
   * @return {Surface}
   * @public
   */

  this.getSurface = function() {
    return this.getController().getFocusedSurface();
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

oo.inherit(SurfaceTool, Tool);
module.exports = SurfaceTool;
