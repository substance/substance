'use strict';

var ControllerTool = require('./ControllerTool');

function RedoTool() {
  RedoTool.super.apply(this, arguments);
}

ControllerTool.extend(RedoTool);
RedoTool.static.name = 'redo';
RedoTool.static.command = 'redo';

module.exports = RedoTool;
