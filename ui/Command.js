'use strict';

import oo from '../util/oo'

/**
 Abstract interface for commands.

 @class
*/

function Command(params) {
  this.params = params || {};
  this.name = this.params.name;
  if (!this.name) {
    throw new Error("'name' is required");
  }
}

Command.Prototype = function() {

  this._isCommand = true;

  this.getName = function() {
    return this.name;
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
    var sel = props.selection || props.selectionState.getSelection();
    if (!sel) {
      throw new Error("'selection' is required.");
    }
    return sel;
  };

};

oo.initClass(Command);

export default Command;
