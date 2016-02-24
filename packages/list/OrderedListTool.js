'use strict';

var SurfaceTool = require('../../ui/SurfaceTool');

function OrderedListTool() {
  OrderedListTool.super.apply(this, arguments);
}

SurfaceTool.extend(OrderedListTool);

OrderedListTool.static.name = 'ordered-list';
OrderedListTool.static.command = 'ordered-list';

module.exports = OrderedListTool;
