'use strict';

var AnnotationCommand = require('../../ui/AnnotationCommand');

var CodeCommand = AnnotationCommand.extend();

CodeCommand.static.name = 'code';
CodeCommand.static.annotationType = 'code';

module.exports = CodeCommand;