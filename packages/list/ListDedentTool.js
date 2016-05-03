'use strict';

var SurfaceTool = require('../../ui/SurfaceTool');

function ListDedentTool() {
  ListDedentTool.super.apply(this, arguments);
}

SurfaceTool.extend(ListDedentTool);

ListDedentTool.static.name = 'Decrease indent of list item';
ListDedentTool.static.command = 'dedent-list-item';

module.exports = ListDedentTool;
