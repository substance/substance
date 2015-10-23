'use strict';

var AnnotationCommand = require('../../ui/AnnotationCommand');
var ToggleEmphasis = AnnotationCommand.extend({
  static: {
    name: 'toggleEmphasis',
    annotationType: 'emphasis'
  }
});

module.exports = ToggleEmphasis;