'use strict';

var AnnotationCommand = require('../../ui/AnnotationCommand');

var StrongCommand = AnnotationCommand.extend();

StrongCommand.static.name = 'strong';
StrongCommand.static.annotationType = 'strong';

module.exports = StrongCommand;