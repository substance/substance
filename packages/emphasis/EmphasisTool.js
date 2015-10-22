'use strict';

var AnnotationTool = require('../../ui/AnnotationTool');

var EmphasisTool = AnnotationTool.extend({
  static: {
    name: 'emphasis',
    command: 'toggleEmphasis'
  }
});

module.exports = EmphasisTool;