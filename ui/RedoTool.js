'use strict';

var ControllerTool = require('./ControllerTool');

var RedoTool = ControllerTool.extend({
  static: {
    name: 'redo',
    command: 'redo'  
  }
});

module.exports = RedoTool;
