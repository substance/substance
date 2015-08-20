'use strict';

var Document = require('../../document');

var TestContainerAnnotation = Document.ContainerAnnotation.extend({
  name: 'test-container-anno',
});

module.exports = TestContainerAnnotation;