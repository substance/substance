'use strict';

var ControllerTool = require('./ControllerTool');

function UndoTool() {
  UndoTool.super.apply(this, arguments);
}

ControllerTool.extend(UndoTool);
UndoTool.static.name = 'undo';
UndoTool.static.command = 'undo';

module.exports = UndoTool;
