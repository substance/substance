'use strict';

var Component = require('./Component');
var capitalize = require('lodash/capitalize');

/**
  Abstract Tool interface for editing and annotation tools.

  A tool must be associated with a Command, which holds all the logic, while the tool
  is just the visual representation of the command state.

  Like with {@link ui/Command} are two categories of tools, {@link ui/SurfaceTool}
  and {@link ui/ControllerTool}.

  @class
  @component
*/
function Tool() {
  Tool.super.apply(this, arguments);
}

Tool.Prototype = function() {

  // TODO: We should consider not exposing a broad interface
  // here. Rather tools should use this.context

  /**
    Return the currently controller

    @return {ui/Surface}
  */
  this.getController = function() {
    console.warn('use this.context.controller');
    return this.context.controller;
  };

  /**
    Return the currently focused surface

    @return {ui/Surface}
  */
  this.getSurface = function() {
    console.warn('use this.context.surface');
    return this.getController().getFocusedSurface();
  };

  /**
    Return the document associated with the focused surface.

    @return {model/Document}
  */
  this.getDocument = function() {
    console.warn('use this.context.document');
    return this.getController().getDocument();
  };

  /**
    Return the currently active container

    @return {Document.Container}
    @public
  */
  this.getContainer = function() {
    console.warn('use this.context.surface.getContainer()');
    var surface = this.getSurface();
    if (surface) {
      return surface.getContainer();
    }
  };

  /**
    Default tool rendering. You can override this method to provide your custom markup
  */
  this.render = function($$) {
    var el = $$('div')
      .addClass('se-tool');

    var title = this.getTitle();
    if (title) {
      el.attr('title', title);
      el.attr('aria-label', title);
    }
    //.sm-disabled
    if (this.props.disabled) {
      el.addClass('sm-disabled');
    }
    // .sm-active
    if (this.props.active) {
      el.addClass('sm-active');
    }
    // .sm-<mode>
    // TODO: it seems that the mode class is not following the 'sm-' prefix-rules
    if (this.props.mode) {
      el.addClass(this.props.mode);
    }

    // button
    el.append(this.renderButton($$));
    return el;
  };

  this.renderButton = function($$) {
    var button = $$('button')
      .on('click', this.onClick)
      .append(this.props.children);

    if (this.props.disabled) {
      // make button inaccessible
      button.attr('tabindex', -1);
    } else {
      // make button accessible for tab-navigation
      button.attr('tabindex', 1);
    }
    return button;
  };

  this.getTitle = function() {
    var title = this.props.title || this.i18n.t(this.getName());
    // Used only by annotation tool so far
    if (this.props.mode) {
      title = [capitalize(this.props.mode), title].join(' ');
    }
    return title;
  };

  /**
    Get tool registration name
  */
  this.getName = function() {
    return this.constructor.static.name;
  };

  this.getCommandName = function() {
    return this.constructor.static.command || this.constructor.static.name;
  };

  this.onClick = function(e) {
    e.preventDefault();
    e.stopPropagation();
    if (this.props.disabled) {
      return;
    }
    this.performAction();
  };

  /**
    Executes the associated command
  */
  this.performAction = function() {
    this.context.commandManager.executeCommand(this.getCommandName());
  };

};

Component.extend(Tool);

module.exports = Tool;
