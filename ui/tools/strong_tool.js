'use strict';

var AnnotationTool = require('./annotation_tool');

var StrongTool = AnnotationTool.extend({
  static: {
    name: 'strong',
    command: 'toggleStrong'
  }
});

module.exports = StrongTool;