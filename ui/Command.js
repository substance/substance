'use strict';

var oo = require('../util/oo');

/**
 Abstract interface for commands.
 
 @class
*/

var Command = function() {
};

Command.Prototype = function() {

  /**
    Execute command
    
    @abstract
    @return {Object} info object with execution details
  */
  this.execute = function() {
    throw new Error('execute must be implemented by custom commands');
  };
};

oo.initClass(Command);

module.exports = Command;