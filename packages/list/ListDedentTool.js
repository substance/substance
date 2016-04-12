'use strict';

var SurfaceTool = require('../../ui/SurfaceTool');

function ListDedentTool() {
  ListDedentTool.super.apply(this, arguments);
}

SurfaceTool.extend(ListDedentTool);

ListDedentTool.static.name = 'dedent-list-item';
ListDedentTool.static.command = 'dedent-list-item';

module.exports = ListDedentTool;
