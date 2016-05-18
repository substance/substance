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

};

ControllerCommand.Prototype = function() {

  this.isControllerCommand = function() {
    return true;
  };

};

Command.extend(ControllerCommand);

module.exports = ControllerCommand;
