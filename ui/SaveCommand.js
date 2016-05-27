'use strict';

var ControllerCommand = require('./ControllerCommand');

function SaveCommand() {
  SaveCommand.super.apply(this, arguments);
}

SaveCommand.Prototype = function() {

  this.getCommandState = function(context) {
    var dirty = context.documentSession.isDirty();
    console.log('SaveCommand.dirty', dirty);
    return {
      disabled: !dirty,
      active: false
    };
  };

  this.execute = function(context) {
    var documentSession = context.documentSession;
    documentSession.save();
    return {
      status: 'saving-process-started'
    };
  };
};

ControllerCommand.extend(SaveCommand);

SaveCommand.static.name = 'save';

module.exports = SaveCommand;
