'use strict';

var AnnotationCommand = require('../../ui/AnnotationCommand');

function EmphasisCommand() {
  EmphasisCommand.super.apply(this, arguments);
}
AnnotationCommand.extend(EmphasisCommand);

EmphasisCommand.static.name = 'emphasis';
EmphasisCommand.static.annotationType = 'emphasis';

module.exports = EmphasisCommand;