'use strict';

var AnnotationTool = require('../../ui/AnnotationTool');

var StrongTool = AnnotationTool.extend({
  static: {
    name: 'strong',
    command: 'strong'
  }
});

module.exports = StrongTool;
