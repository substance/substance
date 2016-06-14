'use strict';

var Command = require('../../ui/Command');

function SaveCommand() {
  SaveCommand.super.apply(this, arguments);
}

SaveCommand.Prototype = function() {
  this.getCommandState = function(props, context) {
    var dirty = context.documentSession.isDirty();
    return {
      disabled: !dirty,
      active: false
    };
  };

  this.execute = function(props, context) {
    var documentSession = context.documentSession;
    documentSession.save();
    return {
      status: 'saving-process-started'
    };
  };
};

Command.extend(SaveCommand);
SaveCommand.static.name = 'save';

module.exports = SaveCommand;
