'use strict';

var oo = require('../util/oo');

/**
 Abstract interface for commands.

 @class
*/

var Command = function() {};

Command.Prototype = function() {

  this.getName = function() {
    return this.constructor.static.name;
  };

  this.getCommandState = function(sessionState, context) {
    throw new Error('Command.getCommandState() is abstract.');
  };

  /**
    Execute command

    @abstract
    @return {Object} info object with execution details
  */
  this.execute = function(context, args) {
    throw new Error('Command.execute() is abstract.');
  };

};

oo.initClass(Command);

module.exports = Command;
