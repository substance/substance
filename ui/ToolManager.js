'use strict';

var oo = require('../util/oo');
var without = require('lodash/without');

var DEFAULT_TOOLSTATE = {
  disabled: true,
  active: false
};

/*
 * Listens to changes on the document and selection and updates registered tools accordingly.
 *
 * @class
 */
function ToolManager(controller) {
  if (!controller) {
    throw new Error('Illegal arguments: controller is mandatory.');
  }

  this.controller = controller;
  this.tools = [];

  var docSession = this.controller.getDocumentSession();
  docSession.on('selection:changed', this.updateTools, this);
  this.controller.on('document:saved', this.updateTools, this);
}

ToolManager.Prototype = function() {

  this.dispose = function() {
    var docSession = this.controller.getDocumentSession();
    docSession.off(this);
    this.controller.off(this);
  };

  this.getCommandState = function(tool) {
    var cmd = this.getCommand(tool);

    if (cmd) {
      return cmd.getCommandState();
    } else {
      return DEFAULT_TOOLSTATE;
    }
  };

  this.registerTool = function(tool) {
    this.tools.push(tool);
  };

  this.unregisterTool = function(tool) {
    this.tools = without(this.tools, tool);
  };

  // Get command for a certain tool
  this.getCommand = function(tool) {
    var commandName = tool.constructor.static.command;

    if (tool._isSurfaceTool) {
      var surface = this.controller.getFocusedSurface();
      return surface ? surface.getCommand(commandName) : false;
    } else if (tool._isControllerTool) {
      return this.controller.getCommand(commandName);
    }
  };

  // Just updates all tool states
  this.updateTools = function() {
    // console.log('Updating tools');
    this.tools.forEach(function(tool) {
      var state = this.getCommandState(tool);
      tool.setState(state);
    }.bind(this));
  };
};

oo.initClass(ToolManager);

module.exports = ToolManager;
