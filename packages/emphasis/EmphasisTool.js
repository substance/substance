'use strict';

var AnnotationTool = require('../../ui/AnnotationTool');

function EmphasisTool() {
  EmphasisTool.super.apply(this, arguments);
}

AnnotationTool.extend(EmphasisTool);

EmphasisTool.static.name = 'emphasis';

module.exports = EmphasisTool;
