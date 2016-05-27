'use strict';

var ControllerTool = require('./ControllerTool');

function SaveTool() {
  SaveTool.super.apply(this, arguments);
}


ControllerTool.extend(SaveTool);

SaveTool.static.name = 'save';

module.exports = SaveTool;
