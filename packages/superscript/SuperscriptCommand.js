'use strict';

var AnnotationCommand = require('../../ui/AnnotationCommand');
var oo = require('../../util/oo');

function SuperscriptCommand() {
  AnnotationCommand.apply(this, arguments);
}
oo.inherit(SuperscriptCommand, AnnotationCommand);

SuperscriptCommand.static = {
  name: 'superscript',
  annotationType: 'superscript' 
};

module.exports = SuperscriptCommand;