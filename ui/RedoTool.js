'use strict';

var Tool = require('./Tool');

function RedoTool() {
  RedoTool.super.apply(this, arguments);
}

Tool.extend(RedoTool);

RedoTool.static.name = 'redo';

module.exports = RedoTool;
