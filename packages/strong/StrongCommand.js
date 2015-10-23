'use strict';

var AnnotationCommand = require('../../ui/AnnotationCommand');

var StrongCommand = AnnotationCommand.extend({
  static: {
    name: 'toggleStrong',
    annotationType: 'strong'
  }
});


module.exports = StrongCommand;