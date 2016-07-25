'use strict';

var Command = require('../../ui/Command');

function Redo() {
  Command.call(this, { name: 'redo' });
}

Redo.Prototype = function() {

  this.getCommandState = function(props, context) {
    var docSession = context.documentSession;
    return {
      disabled: !docSession.canRedo(),
      active: false
    };
  };

  this.execute = function(props, context) {
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

module.exports = Redo;
