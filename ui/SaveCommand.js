'use strict';

var ControllerCommand = require('./ControllerCommand');

function SaveCommand() {
  SaveCommand.super.apply(this, arguments);
}

SaveCommand.Prototype = function() {

  this.getCommandState = function() {
    var doc = this.getDocument();
    return {
      disabled: !doc.__dirty,
      active: false
    };
  };

  this.execute = function() {
    this.getController().saveDocument();
    return {
      status: 'saving-process-started'
    };
  };
};

ControllerCommand.extend(SaveCommand);

SaveCommand.static.name = 'save';

module.exports = SaveCommand;
