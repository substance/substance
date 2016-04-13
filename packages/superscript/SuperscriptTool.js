'use strict';

var SurfaceTool = require('../../ui/SurfaceTool');

function SuperscriptTool() {
  SuperscriptTool.super.apply(this, arguments);
}
SurfaceTool.extend(SuperscriptTool);

SuperscriptTool.static.name = 'superscript';

module.exports = SuperscriptTool;