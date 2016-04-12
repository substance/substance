'use strict';

var Tool = require('./Tool');

/**
  Abstract class for tools tools that interact with a document. E.g. UndoTool or
  RedoTool. Needs to be instantiated inside a {@link ui/Controller} context.

  @class
  @extends ui/Tool

  @example

  ```js
  var ControllerTool = require('substance/ui/ControllerTool');
  function SaveTool() {
    SaveTool.super.apply(this, arguments);
  }
  ControllerTool.extend(SaveTool);
  SaveTool.static.name = 'save';
  SaveTool.static.command = 'save';
  ```
 */

function ControllerTool() {
  ControllerTool.super.apply(this, arguments);

  if (!this.context.controller) {
    throw new Error('No controller context found.');
  }
}

ControllerTool.Prototype = function() {

  this._isControllerTool = true;

  /*
    Get document instance

    @return {model/Document} The document instance owned by the controller
  */
  this.getDocument = function() {
    return this.context.controller.getDocument();
  };

  /**
    Executes the associated command
  */
  this.performAction = function() {
    var ctrl = this.getController();
    ctrl.executeCommand(this.constructor.static.command);
  };
};

Tool.extend(ControllerTool);

module.exports = ControllerTool;
