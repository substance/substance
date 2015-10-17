'use strict';

var ControllerTool = require('./controller_tool');

var UndoTool = ControllerTool.extend({
  static: {
    name: 'undo',
    command: 'undo'
  }
});

module.exports = UndoTool;
