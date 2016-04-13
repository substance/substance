'use strict';

var ControllerTool = require('./ControllerTool');

function UndoTool() {
  UndoTool.super.apply(this, arguments);
}

ControllerTool.extend(UndoTool);

UndoTool.static.name = 'undo';

module.exports = UndoTool;
