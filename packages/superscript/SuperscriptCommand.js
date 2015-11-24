'use strict';

var AnnotationCommand = require('../../ui/AnnotationCommand');

function SuperscriptCommand() {
  SuperscriptCommand.super.apply(this, arguments);
}

var SuperscriptCommand = AnnotationCommand.extend();

SuperscriptCommand.static.name = 'superscript';
SuperscriptCommand.static.annotationType = 'superscript';

module.exports = SuperscriptCommand;