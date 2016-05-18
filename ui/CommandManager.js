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

  /*
    Compute new command states object
  */
  this.updateCommandStates = function() {
    var commandStates = {};
    var controller = this.controller;
    var surface = controller.getFocusedSurface();
    var documentSession = controller.documentSession;

    this.commandRegistry.each(function(cmd) {
      var context = {
        surface: surface,
        documentSession: documentSession,
        document: documentSession.getDocument(),
        controller: controller,
      };
      commandStates[cmd.getName()] = cmd.getCommandState(context);
    });

    this.commandStates = commandStates;
  };

  this.getCommandStates = function() {
    return this.commandStates;
  };

  /*
    Get command state, given a context and arguments
  */
  // this.getCommandState = function(commandName) {
  //   var cmd = this.commandRegistry.get(commandName);
  //   if (!cmd) {
  //     warn('command', commandName, 'not registered');
  //     return;
  //   }
  //   return cmd.getCommandState(this.context);    
  // };

  /*
    Execute a command, given a context and arguments
  */
  this.executeCommand = function(commandName, context, args) {
    var cmd = this.commandRegistry.get(commandName);
    if (!cmd) {
      warn('command', commandName, 'not registered');
      return;
    }
    // Run command
    var info = cmd.execute(context, args);
    if (info) {
      // TODO: We want to replace this with a more specific, scoped event
      // but for that we need an improved EventEmitter API
      this.emit('command:executed', info, commandName, cmd);
    } else if (info === undefined) {
      warn('command ', commandName, 'must return either an info object or true when handled or false when not handled');
    }
  };

};

oo.initClass(CommandManager);

module.exports = CommandManager;
