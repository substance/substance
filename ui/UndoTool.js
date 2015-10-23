'use strict';

var ControllerTool = require('./ControllerTool');

var UndoTool = ControllerTool.extend({
  static: {
    name: 'undo',
    command: 'undo'
  }
});

module.exports = UndoTool;
