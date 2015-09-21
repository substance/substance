'use strict';

var OO = require('../../basics/oo');
var Component = require('../component');

function Tool() {
  Component.apply(this, arguments);
}

Tool.Prototype = function() {

  this.getController = function() {
    return this.context.controller;
  };

  this.getName = function() {
    var toolName = this.constructor.static.name;
    if (toolName) {
      return toolName;
    } else {
      throw new Error('Contract: AnnotationTool.static.name should have a value to describe the tool');
    }
  };

  this.getCommand = function() {
    var ctrl = this.getController();
    var commandName = this.constructor.static.command;
    if (commandName) {
      return ctrl.getCommand(commandName);
    } else {
      throw new Error('Contract: AnnotationTool.static.command should be associated to a supported command.');
    }
  };

  this.isEnabled = function() {
    return !this.state.disabled;
  };

  this.isDisabled = function() {
    return this.state.disabled;
  };

  this.setEnabled = function() {
    this.setState({
      disabled: false,
      active: false
    });
  };

  this.setDisabled = function() {
    this.setState({
      disabled: true,
      active: false
    });
  };

  this.setActive = function() {
    this.setToolState({
      disabled: false,
      active: true
    });
  };

  this.getInitialState = function() {
    return {
      // we disable tools by default
      disabled: true,
      // if the tool is turned on / toggled on
      active: false
    };
  };

  this.performAction = function() {
    var command = this.getCommand();
    command.execute();
  };

  this.render = function() {
    throw new Error('render is abstract.');
  };
};

OO.inherit(Tool, Component);
module.exports = Tool;
