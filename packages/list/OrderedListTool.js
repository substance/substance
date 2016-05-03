'use strict';

var SurfaceTool = require('../../ui/SurfaceTool');

function OrderedListTool() {
  OrderedListTool.super.apply(this, arguments);
}

SurfaceTool.extend(OrderedListTool);

OrderedListTool.static.name = 'Numbered list';
OrderedListTool.static.command = 'ordered-list';

module.exports = OrderedListTool;
