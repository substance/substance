'use strict';

var Tool = require('../../ui/Tool');

function RedoTool() {
  RedoTool.super.apply(this, arguments);
}

Tool.extend(RedoTool);

RedoTool.static.name = 'redo';

module.exports = RedoTool;