'use strict';

var Tool = require('./Tool');

// TODO: we no longer need ControllerTool as a specialization

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

};

Tool.extend(ControllerTool);

module.exports = ControllerTool;
