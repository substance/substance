'use strict';

var oo = require('../util/oo');
var each = require('lodash/each');
var warn = require('../util/warn');
var Registry = require('../util/Registry');

/*
  Listens to changes on the document and selection and updates registered tools accordingly.
  
  @class
*/
function CommandManager(controller, commands) {
  this.controller = controller;
  this.documentSession = controller.documentSession;

  // Set up command registry
  this.commandRegistry = new Registry();
  each(commands, function(CommandClass) {
    var cmd = new CommandClass();
    this.commandRegistry.add(CommandClass.static.name, cmd);
  }.bind(this));

  this.updateCommandStates();
  this.documentSession.on('update', this.updateCommandStates, this);
}

CommandManager.Prototype = function() {

  this.dispose = function() {
    this.documentSession.off(this);
  };

  this.getContext = function() {
    var controller = this.controller;
    var surface = controller.getFocusedSurface();
    var documentSession = controller.documentSession;

    return {
      surface: surface,
      documentSession: documentSession,
      document: documentSession.getDocument(),
      controller: controller,
    };
  };

  /*
    Compute new command states object
  */
  this.updateCommandStates = function() {
    var commandStates = {};

    this.commandRegistry.each(function(cmd) {
      commandStates[cmd.getName()] = cmd.getCommandState(this.getContext());
    }.bind(this));

    this.commandStates = commandStates;
  };

  /*
    Exposes the current commandStates object
  */
  this.getCommandStates = function() {
    return this.commandStates;
  };

  /*
    Execute a command, given a context and arguments
  */
  this.executeCommand = function(commandName, args) {
    var cmd = this.commandRegistry.get(commandName);
    if (!cmd) {
      warn('command', commandName, 'not registered');
      return;
    }
    // Run command
    var info = cmd.execute(this.getContext(), args);
    if (info === undefined) {
      warn('command ', commandName, 'must return either an info object or true when handled or false when not handled');
    }
    return info;
  };

};

oo.initClass(CommandManager);

module.exports = CommandManager;
