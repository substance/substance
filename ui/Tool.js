'use strict';

var Component = require('./Component');
var capitalize = require('lodash/capitalize');
var $$ = Component.$$;

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

  this.context.toolManager.registerTool(this);
}

Tool.Prototype = function() {

  /*
    Initialize toolstate. Obtained from the toolmanager by asking for
    the associated command state.
  */
  this.getInitialState = function() {
    return this.context.toolManager.getCommandState(this);
  };

  this.dispose = function() {
    this.context.toolManager.unregisterTool(this);
  };

  /**
    Get controller context
  */
  this.getController = function() {
    return this.context.controller;
  };

  /**
    Get tool registration name
  */
  this.getName = function() {
    var toolName = this.constructor.static.name;
    if (toolName) {
      return toolName;
    } else {
      throw new Error('Contract: Tool.static.name must have a value');
    }
  };

  this.onClick = function(e) {
    e.preventDefault();
    e.stopPropagation();
    if (this.state.disabled) {
      return;
    }
    this.performAction();
  };

  /**
    Default tool rendering. You can override this method to provide your custom markup
  */
  this.render = function() {
    var title = this.props.title || this.i18n.t(this.getName());
    // Used only by annotation tool so far
    if (this.state.mode) {
      title = [capitalize(this.state.mode), title].join(' ');
    }
    var el = $$('div')
      .attr('title', title)
      .addClass('se-tool');
    el.append(
      $$('button').append(this.props.children)
    ).on('click', this.onClick);
    if (this.state.disabled) {
      el.addClass('sm-disabled');
    }
    if (this.state.mode) {
      el.addClass(this.state.mode);
    }
    if (this.state.active) {
      el.addClass('sm-active');
    }
    return el;
  };
};

Component.extend(Tool);
module.exports = Tool;
