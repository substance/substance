'use strict';

var AnnotationCommand = require('../../ui/AnnotationCommand');
var oo = require('../../util/oo');

function CodeCommand() {
  AnnotationCommand.apply(this, arguments);
}
oo.inherit(CodeCommand, AnnotationCommand);

CodeCommand.static = {
  name: 'code',
  annotationType: 'code' 
};

module.exports = CodeCommand;