'use strict';

var AnnotationTool = require('../../ui/AnnotationTool');

function StrongTool() {
  StrongTool.super.apply(this, arguments);
}
AnnotationTool.extend(StrongTool);

StrongTool.static.name = 'strong';

module.exports = StrongTool;