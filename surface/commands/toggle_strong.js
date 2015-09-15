'use strict';

var AnnotationCommand = require('./toggle_annotation');

var ToggleStrong = AnnotationCommand.extend({
  static: {
    name: 'toggleStrong',
    annotationType: 'strong'
  }
});


module.exports = ToggleStrong;