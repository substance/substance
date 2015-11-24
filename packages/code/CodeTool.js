'use strict';

var SurfaceTool = require('../../ui/SurfaceTool');

function CodeTool() {
  SurfaceTool.apply(this, arguments);
}

SurfaceTool.extend(CodeTool);
CodeTool.static.name = 'code';
CodeTool.static.command = 'code';

module.exports = CodeTool;