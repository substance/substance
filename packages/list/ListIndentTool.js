'use strict';

var SurfaceTool = require('../../ui/SurfaceTool');

function ListIndentTool() {
  ListIndentTool.super.apply(this, arguments);
}

SurfaceTool.extend(ListIndentTool);

ListIndentTool.static.name = 'Increase indent of list item';
ListIndentTool.static.command = 'indent-list-item';

module.exports = ListIndentTool;
