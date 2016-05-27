'use strict';

var Component = require('./Component');
var capitalize = require('lodash/capitalize');

/**
  Default Tool implementation

  A tool must be associated with a Command, which holds all the logic, while the tool
  is just the visual representation of the command state.

  @class
  @component
*/
function Tool() {
  Tool.super.apply(this, arguments);
}

Tool.Prototype = function() {

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

    // button
    el.append(this.renderButton($$));
    return el;
  };

  this.renderButton = function($$) {
    var button = $$('button')
      .on('click', this.onClick)
      .append(this.renderIcon($$));

    if (this.props.disabled) {
      // make button inaccessible
      button.attr('tabindex', -1);
    } else {
      // make button accessible for tab-navigation
      button.attr('tabindex', 1);
    }
    return button;
  };

  this.renderIcon = function($$) {
    var commandName = this.getCommandName();
    var iconEl = this.context.iconProvider.renderIcon($$, commandName);
    return iconEl;
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
