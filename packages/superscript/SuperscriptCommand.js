'use strict';

var AnnotationCommand = require('../../ui/AnnotationCommand');

function SuperscriptCommand() {
  SuperscriptCommand.super.apply(this, arguments);
}

AnnotationCommand.extend(SuperscriptCommand);

SuperscriptCommand.static.name = 'superscript';

module.exports = SuperscriptCommand;