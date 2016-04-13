'use strict';

var ControllerTool = require('./ControllerTool');

function RedoTool() {
  RedoTool.super.apply(this, arguments);
}

ControllerTool.extend(RedoTool);

RedoTool.static.name = 'redo';

module.exports = RedoTool;
