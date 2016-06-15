'use strict';

var AnnotationTool = require('../../ui/AnnotationTool');

function CodeTool() {
  AnnotationTool.apply(this, arguments);
}

AnnotationTool.extend(CodeTool);

CodeTool.static.name = 'code';

module.exports = CodeTool;