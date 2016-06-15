'use strict';

var AnnotationCommand = require('../../ui/AnnotationCommand');

var CodeCommand = AnnotationCommand.extend();

CodeCommand.static.name = 'code';

module.exports = CodeCommand;