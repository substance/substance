'use strict';

var oo = require('../../util/oo');
var ContainerAnnotation = require('../../model/ContainerAnnotation');

function TestContainerAnnotation() {
  TestContainerAnnotation.super.apply(this, arguments);
}

oo.inherit(TestContainerAnnotation, ContainerAnnotation);

TestContainerAnnotation.static.name = 'test-container-anno';

module.exports = TestContainerAnnotation;