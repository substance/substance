'use strict';

var ControllerCommand = require('./ControllerCommand');

function SaveCommand() {
  SaveCommand.super.apply(this, arguments);
}

SaveCommand.Prototype = function() {

  this.getCommandState = function(context) {
    var doc = context.document;
    return {
      disabled: !doc.__dirty,
      active: false
    };
  };

  this.execute = function() {
    var controller = this.context.controller;
    controller.saveDocument();
    return {
      status: 'saving-process-started'
    };
  };
};

ControllerCommand.extend(SaveCommand);

SaveCommand.static.name = 'save';

module.exports = SaveCommand;
