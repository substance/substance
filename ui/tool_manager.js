'use strict';

var OO = require('../basics/oo');
var ControllerTool = require('./tools/controller_tool');
var SurfaceTool = require('./tools/surface_tool');
var without = require('lodash/array/without');

var DEFAULT_TOOLSTATE = {
  disabled: true,
  active: false
};

/**
 * Listens to changes on the document and selection and updates registered tools accordingly.
 * 
 * @class
 * @memberof module:ui
 */
function ToolManager(controller) {
  if (!controller) {
    throw new Error('Illegal arguments: controller is mandatory.');
  }

  this.controller = controller;
  this.tools = [];

  var doc = this.controller.getDocument();

  doc.connect(this, {
    "document:changed": this.updateTools
  }, { priority: -2 });

  this.controller.connect(this, {
    'selection:changed': this.updateTools,
    'document:saved': this.updateTools
  });
}

ToolManager.Prototype = function() {

  this.dispose = function() {
    var doc = this.controller.getDocument();
    this.controller.disconnect(this);
    doc.disconnect(this);
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
    this.tools.forEach(function(tool) {
      var state = this.getCommandState(tool);
      tool.setState(state);
    }.bind(this));
  };
};

OO.initClass(ToolManager);

module.exports = ToolManager;
