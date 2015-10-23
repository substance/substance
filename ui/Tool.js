'use strict';

var oo = require('../util/oo');
var Component = require('./Component');

function Tool() {
  Component.apply(this, arguments);
  this.context.toolManager.registerTool(this);
}

Tool.Prototype = function() {

  this.getInitialState = function() {
    var state = this.context.toolManager.getCommandState(this);
    return state;
  };

  this.dispose = function() {
    this.context.toolManager.unregisterTool(this);
  };

  this.getController = function() {
    return this.context.controller;
  };

  this.getName = function() {
    var toolName = this.constructor.static.name;
    if (toolName) {
      return toolName;
    } else {
      throw new Error('Contract: Tool.static.name must have a value');
    }
  };

  this.performAction = function() {
    var ctrl = this.getController();
    ctrl.executeCommand(this.constructor.static.command);
  };

  this.render = function() {
    throw new Error('render is abstract.');
  };
};

oo.inherit(Tool, Component);
module.exports = Tool;
