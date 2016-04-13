'use strict';

var SurfaceTool = require('../../ui/SurfaceTool');

function StrongTool() {
  StrongTool.super.apply(this, arguments);
}
SurfaceTool.extend(StrongTool);

StrongTool.static.name = 'strong';

module.exports = StrongTool;