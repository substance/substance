'use strict';

var ControllerCommand = require('./ControllerCommand');

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

ControllerCommand.extend(Undo);

ControllerCommand.static.name = 'undo';

module.exports = Undo;