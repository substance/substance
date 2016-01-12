'use strict';

var ControllerCommand = require('./ControllerCommand');

function Redo() {
  Redo.super.apply(this, arguments);
}

Redo.Prototype = function() {

  this.getCommandState = function() {
    var docSession = this.getDocumentSession();
    return {
      disabled: !docSession.canRedo(),
      active: false
    };
  };

  this.execute = function() {
    var docSession = this.getDocumentSession();
    if (docSession.canRedo()) {
      docSession.redo();
      return true;
    } else {
      return false;
    }
  };
};

ControllerCommand.extend(Redo);

Redo.static.name = 'redo';

module.exports = Redo;
