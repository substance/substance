'use strict';

var AnnotationCommand = require('../../ui/AnnotationCommand');

function StrongCommand() {
  StrongCommand.super.apply(this, arguments);
}

AnnotationCommand.extend(StrongCommand);

StrongCommand.static.name = 'strong';
StrongCommand.static.annotationType = 'strong';

module.exports = StrongCommand;