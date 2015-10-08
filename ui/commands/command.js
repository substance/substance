'use strict';

var Substance = require('../../basics');

var Command = function() {
};

Command.Prototype = function() {

  this.execute = function() {
    throw new Error('execute must be implemented by custom commands');
  };
};

Substance.initClass(Command);

module.exports = Command;