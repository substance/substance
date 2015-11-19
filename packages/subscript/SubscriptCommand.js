'use strict';

var AnnotationCommand = require('../../ui/AnnotationCommand');
var oo = require('../../util/oo');

function SubscriptCommand() {
  AnnotationCommand.apply(this, arguments);
}
oo.inherit(SubscriptCommand, AnnotationCommand);

SubscriptCommand.static = {
  name: 'subscript',
  annotationType: 'subscript' 
};

module.exports = SubscriptCommand;