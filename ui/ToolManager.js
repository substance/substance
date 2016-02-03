'use strict';

var oo = require('../util/oo');
var ControllerTool = require('./ControllerTool');
var SurfaceTool = require('./SurfaceTool');
var without = require('lodash/array/without');

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
  docSession.connect(this, {
    'selection:changed': this.updateTools
  });
  this.controller.connect(this, {
    'document:saved': this.updateTools
  });
}

ToolManager.Prototype = function() {

  this.dispose = function() {
    var docSession = this.controller.getDocumentSession();
    this.controller.disconnect(this);
    docSession.disconnect(this);
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

    if (tool instanceof SurfaceTool) {
      var surface = this.controller.getFocusedSurface();
      return surface ? surface.getCommand(commandName) : false;
    } else if (tool instanceof ControllerTool) {
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
