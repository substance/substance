/* jshint latedef:nofunc */
'use strict';

var SurfaceTool = require('../../ui/SurfaceTool');

function LinkTool() {
  LinkTool.super.apply(this, arguments);
}

SurfaceTool.extend(LinkTool);

LinkTool.static.name = 'link';


module.exports = LinkTool;
