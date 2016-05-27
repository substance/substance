'use strict';

var Tool = require('./Tool');

function SaveTool() {
  SaveTool.super.apply(this, arguments);
}


Tool.extend(SaveTool);

SaveTool.static.name = 'save';

module.exports = SaveTool;
