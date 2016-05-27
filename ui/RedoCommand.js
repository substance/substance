'use strict';

var Command = require('./Command');

function Redo() {
  Redo.super.apply(this, arguments);
}

Redo.Prototype = function() {

  this.getCommandState = function(context) {
    var docSession = context.documentSession;
    return {
      disabled: !docSession.canRedo(),
      active: false
    };
  };

  this.execute = function(context) {
    var docSession = context.documentSession;
    if (docSession.canRedo()) {
      docSession.redo();
      return true;
    } else {
      return false;
    }
  };
};

Command.extend(Redo);

Redo.static.name = 'redo';

module.exports = Redo;
