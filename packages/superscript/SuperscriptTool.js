'use strict';

var AnnotationTool = require('../../ui/AnnotationTool');
var oo = require('../../util/oo');

function SuperscriptTool() {
  AnnotationTool.apply(this, arguments);
}

oo.inherit(SuperscriptTool, AnnotationTool);

SuperscriptTool.static = {
  name: 'superscript',
  command: 'superscript' 
};

module.exports = SuperscriptTool;