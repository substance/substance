'use strict';

var AnnotationTool = require('../../ui/AnnotationTool');

function SuperscriptTool() {
  SuperscriptTool.super.apply(this, arguments);
}
AnnotationTool.extend(SuperscriptTool);

SuperscriptTool.static.name = 'superscript';

module.exports = SuperscriptTool;