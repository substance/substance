'use strict';

var SurfaceTool = require('../../ui/SurfaceTool');

function SubscriptTool() {
  SubscriptTool.super.apply(this, arguments);
}
SurfaceTool.extend(SubscriptTool);

SubscriptTool.static.name = 'subscript';

module.exports = SubscriptTool;