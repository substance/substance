'use strict';

var AnnotationCommand = require('../../ui/AnnotationCommand');

var StrongCommand = AnnotationCommand.extend({
  static: {
    name: 'strong',
    annotationType: 'strong'
  }
});


module.exports = StrongCommand;