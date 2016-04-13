'use strict';

var SurfaceTool = require('../../ui/SurfaceTool');

function CodeTool() {
  SurfaceTool.apply(this, arguments);
}

SurfaceTool.extend(CodeTool);

CodeTool.static.name = 'code';

module.exports = CodeTool;