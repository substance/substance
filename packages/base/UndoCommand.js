'use strict';

var Command = require('../../ui/Command');

function Undo(params) {
  Command.call(this, params);
}

Undo.Prototype = function() {

  this.getCommandState = function(props, context) {
    var docSession = context.documentSession;
    return {
      disabled: !docSession.canUndo(),
      active: false
    };
  };

  this.execute = function(props, context) {
    var docSession = context.documentSession;
    if (docSession.canUndo()) {
      docSession.undo();
      return true;
    }
    return false;
  };
};

Command.extend(Undo);

module.exports = Undo;
