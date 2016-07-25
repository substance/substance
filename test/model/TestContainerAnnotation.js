'use strict';

var ContainerAnnotation = require('../../model/ContainerAnnotation');

function TestContainerAnnotation() {
  TestContainerAnnotation.super.apply(this, arguments);
}

ContainerAnnotation.extend(TestContainerAnnotation);

TestContainerAnnotation.type = 'test-container-anno';

module.exports = TestContainerAnnotation;