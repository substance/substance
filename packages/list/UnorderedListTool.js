'use strict';

var SurfaceTool = require('../../ui/SurfaceTool');

function UnorderedListTool() {
  UnorderedListTool.super.apply(this, arguments);
}

SurfaceTool.extend(UnorderedListTool);

UnorderedListTool.static.name = 'unordered-list';
UnorderedListTool.static.command = 'unordered-list';

module.exports = UnorderedListTool;
