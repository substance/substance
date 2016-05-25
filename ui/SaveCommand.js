'use strict';

var ControllerCommand = require('./ControllerCommand');

function SaveCommand() {
  SaveCommand.super.apply(this, arguments);
}

SaveCommand.Prototype = function() {

  this.getCommandState = function(context) {
    var dirty = context.documentSession.__dirty;
    return {
      disabled: !dirty,
      active: false
    };
  };

  this.execute = function(context) {
    // controller.saveDocument();
    // context.delegate('save', {...});
    throw new Error('Implement document saving');
    return {
      status: 'saving-process-started'
    };
  };
};

ControllerCommand.extend(SaveCommand);

SaveCommand.static.name = 'save';

module.exports = SaveCommand;
