'use strict';

var Command = require('./Command');

function Undo() {
  Undo.super.apply(this, arguments);
}

Undo.Prototype = function() {
  this.getCommandState = function(context) {
    var docSession = context.documentSession;
    return {
      disabled: !docSession.canUndo(),
      active: false
    };
  };
  this.execute = function(context) {
    var docSession = context.documentSession;
    if (docSession.canUndo()) {
      docSession.undo();
      return true;
    }
    return false;
  };
};

Command.extend(Undo);

Undo.static.name = 'undo';

module.exports = Undo;