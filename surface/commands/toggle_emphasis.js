'use strict';

var AnnotationCommand = require('./toggle_annotation');
var ToggleEmphasis = AnnotationCommand.extend({
  static: {
    name: 'toggleEmphasis',
    annotationType: 'emphasis'
  }
});

module.exports = ToggleEmphasis;