'use strict';

var SurfaceTool = require('../../ui/SurfaceTool');

function SuperscriptTool() {
  SuperscriptTool.super.apply(this, arguments);
}
SurfaceTool.extend(SuperscriptTool);
SuperscriptTool.static.name = 'superscript';
SuperscriptTool.static.command = 'superscript';

module.exports = SuperscriptTool;