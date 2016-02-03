'use strict';

var Command = require('./Command');

/**
  A class for commands intended to be executed on the {@link ui/Controller}
  level. See the example below to learn how to define a custom `ControllerCommand`.

  @class
  @abstract
  @extends ui/Command

  @example

  ```js
  var ControllerCommand = require('substance/ui/ControllerCommand');
  function SaveCommand() {
    ControllerCommand.apply(this, arguments);
  }
  SaveCommand.Prototype = function() {
    this.execute = function() {
      this.getController().saveDocument();
    }
  };
  ControllerCommand.extend(SaveCommand);
  SaveCommand.static.name = 'save';
  ```
*/
var ControllerCommand = function(context) {
  this.context = context;
  this.controller = context.controller;
};

ControllerCommand.Prototype = function() {

  /**
    Get controller instance

    @return {ui/Controller} controller instance
   */
  this.getController = function() {
    return this.controller;
  };

  /**
    Get document instance

    @return {data/Document} document instance owned by the controller
   */
  this.getDocument = function() {
    return this.controller.getDocument();
  };

  this.getDocumentSession = function() {
    return this.controller.getDocumentSession();
  };

  /**
    Execute command

    @return {object} info object with execution details
   */
  this.execute = function() {
    throw new Error('execute must be implemented by custom commands');
  };
};

Command.extend(ControllerCommand);

module.exports = ControllerCommand;
