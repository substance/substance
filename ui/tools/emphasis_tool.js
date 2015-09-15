'use strict';

var AnnotationTool = require('./annotation_tool');

var EmphasisTool = AnnotationTool.extend({
  static: {
    name: 'emphasis',
    command: 'toggleEmphasis'
  }
});

module.exports = EmphasisTool;