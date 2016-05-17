'use strict';

var MethodComponent = require('./MethodComponent');

function ConstructorComponent() {
  MethodComponent.apply(this, arguments);
}

MethodComponent.extend(ConstructorComponent);

module.exports = ConstructorComponent;
