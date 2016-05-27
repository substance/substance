'use strict';

var AnnotationTool = require('../../ui/AnnotationTool');

function SubscriptTool() {
  SubscriptTool.super.apply(this, arguments);
}
AnnotationTool.extend(SubscriptTool);

SubscriptTool.static.name = 'subscript';

module.exports = SubscriptTool;