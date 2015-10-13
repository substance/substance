'use strict';

var OO = require('../basics/oo');
var _ = require('../basics/helpers');

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
    'selection:changed': this.updateTools
  });
}

ToolManager.Prototype = function() {

  this.dispose = function() {
    var doc = this.controller.getDocument();
    this.controller.disconnect(this);
    doc.disconnect(this);
  };

  this.getCommandState = function(tool) {
    var commandName = tool.constructor.static.command;

    var surface = this.controller.getFocusedSurface();
    if (surface) {
      var cmd = surface.getCommand(commandName);
      return cmd.getCommandState();
    } else {
      return DEFAULT_TOOLSTATE;  
    }
  };

  this.registerTool = function(tool) {
    this.tools.push(tool);
  };

  this.unregisterTool = function(tool) {
    this.tools = _.without(this.tools, tool);
  };

  // Just updates all tool states
  this.updateTools = function() {
    var surface = this.controller.getFocusedSurface();
    if (surface) {
      _.each(this.tools, function(tool) {
        var commandName = tool.constructor.static.command;
        var cmd = surface.getCommand(commandName);
        if (cmd) {
          var state = cmd.getCommandState();
          tool.extendState(state);
        } else {
          tool.extendState(DEFAULT_TOOLSTATE);
        }
      });
    }
  };
};

OO.initClass(ToolManager);

module.exports = ToolManager;
