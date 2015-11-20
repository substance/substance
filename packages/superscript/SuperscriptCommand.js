'use strict';

var AnnotationCommand = require('../../ui/AnnotationCommand');

var SuperscriptCommand = AnnotationCommand.extend();

SuperscriptCommand.static.name = 'superscript';
SuperscriptCommand.static.annotationType = 'superscript';

module.exports = SuperscriptCommand;