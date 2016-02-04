'use strict';

var SurfaceTool = require('../../ui/SurfaceTool');

function ListTool() {
  ListTool.super.apply(this, arguments);
}

SurfaceTool.extend(ListTool);

ListTool.static.name = 'list';
ListTool.static.command = 'list';

module.exports = ListTool;
