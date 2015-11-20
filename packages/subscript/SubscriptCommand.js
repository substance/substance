'use strict';

var AnnotationCommand = require('../../ui/AnnotationCommand');

var SubscriptCommand = AnnotationCommand.extend();

SubscriptCommand.static.name = 'subscript';
SubscriptCommand.static.annotationType = 'subscript';

module.exports = SubscriptCommand;