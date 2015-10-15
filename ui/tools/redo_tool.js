'use strict';

var ControllerTool = require('./controller_tool');

var RedoTool = ControllerTool.extend({
  static: {
    name: 'redo',
    command: 'redo'  
  }
});

module.exports = RedoTool;
