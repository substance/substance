'use strict';

var Tool = require('../../ui/Tool');

function UndoTool() {
  UndoTool.super.apply(this, arguments);
}

Tool.extend(UndoTool);
UndoTool.static.name = 'undo';

module.exports = UndoTool;
