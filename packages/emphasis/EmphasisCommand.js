'use strict';

var AnnotationCommand = require('../../ui/AnnotationCommand');
var ToggleEmphasis = AnnotationCommand.extend({
  static: {
    name: 'emphasis',
    annotationType: 'emphasis'
  }
});

module.exports = ToggleEmphasis;