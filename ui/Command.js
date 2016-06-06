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

  this.getCommandState = function(props, context) { // eslint-disable-line
    throw new Error('Command.getCommandState() is abstract.');
  };

  /**
    Execute command

    @abstract
    @return {Object} info object with execution details
  */
  this.execute = function(props, context) { // eslint-disable-line
    throw new Error('Command.execute() is abstract.');
  };

  this._getDocumentSession = function(props, context) {
    var docSession = props.documentSession || context.documentSession;
    if (!docSession) {
      throw new Error("'documentSession' is required.");
    }
    return docSession;
  };

  this._getSelection = function(props) {
    if (!props.selection) {
      throw new Error("'selection' is required.");
    }
    return props.selection;
  };

};

oo.initClass(Command);

module.exports = Command;
