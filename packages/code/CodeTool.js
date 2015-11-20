'use strict';

var AnnotationTool = require('../../ui/AnnotationTool');
var oo = require('../../util/oo');

function CodeTool() {
  AnnotationTool.apply(this, arguments);
}

oo.inherit(CodeTool, AnnotationTool);

CodeTool.static = {
  name: 'code',
  command: 'code' 
};

module.exports = CodeTool;