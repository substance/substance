'use strict';

var SurfaceTool = require('../../ui/SurfaceTool');

function UnorderedListTool() {
  UnorderedListTool.super.apply(this, arguments);
}

SurfaceTool.extend(UnorderedListTool);

UnorderedListTool.static.name = 'Bulleted list';
UnorderedListTool.static.command = 'unordered-list';

module.exports = UnorderedListTool;
