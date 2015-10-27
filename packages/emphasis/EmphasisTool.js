'use strict';

var AnnotationTool = require('../../ui/AnnotationTool');

var EmphasisTool = AnnotationTool.extend({
  static: {
    name: 'emphasis',
    command: 'emphasis'
  }
});

module.exports = EmphasisTool;