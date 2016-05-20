'use strict';

var oo = require('../util/oo');
var without = require('lodash/without');

var DISABLED_TOOLSTATE = {
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
  this._components = [];

  // Compute the initial toolstate
  this.toolState = this.getToolState();

  var docSession = this.controller.getDocumentSession();
  docSession.on('didUpdate', this.updateTools, this);
  this.controller.on('document:saved', this.updateTools, this);
}

ToolManager.Prototype = function() {

  this.dispose = function() {
    var docSession = this.controller.getDocumentSession();
    docSession.off(this);
    this.controller.off(this);
  };

  /*
    Called by components to register for tool state updates
  */
  this.registerComponent = function(comp) {
    this._components.push(comp);
  };

  /*
    Unregister component
  */
  this.unregisterComponent = function(comp) {
    this._components = without(this._components, comp);
  };

  this.registerTool = function(tool) {
    this.tools.push(tool);
  };

  this.unregisterTool = function(tool) {
    this.tools = without(this.tools, tool);
  };

  /*
    Derive tool state from all commands available in the
    current (selection) context
  */
  this.getToolState = function() {
    var toolState = {};

    // Iterate surface commands
    var surface = this.controller.getFocusedSurface();
    if (surface) {
      surface.commandRegistry.each(function(cmd) {
        toolState[cmd.getName()] = cmd.getCommandState();
      });
    } else {
      // Provide disabled defaults for all configured Surface commands
      var surfaceCommands = this.controller.getAllSurfaceCommands();
      surfaceCommands.forEach(function(commandName) {
        toolState[commandName] = DISABLED_TOOLSTATE;
      });
    }
    // Iterate controller commands
    this.controller.commandRegistry.each(function(cmd) {
      toolState[cmd.getName()] = cmd.getCommandState();
    });

    return toolState;
  };

  // Just updates all tool states
  this.updateTools = function() {
    this.toolState = this.getToolState();

    this._components.forEach(function(comp) {
      comp.setProps({
        toolState: this.toolState
      });
    }.bind(this));
  };
};

oo.initClass(ToolManager);

module.exports = ToolManager;
