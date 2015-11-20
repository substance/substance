'use strict';

var AnnotationTool = require('../../ui/AnnotationTool');
var oo = require('../../util/oo');

function SubscriptTool() {
  AnnotationTool.apply(this, arguments);
}

oo.inherit(SubscriptTool, AnnotationTool);

SubscriptTool.static = {
  name: 'subscript',
  command: 'subscript' 
};

module.exports = SubscriptTool;