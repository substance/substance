
var oo = require('../../util/oo');
var MethodComponent = require('./MethodComponent');

function ConstructorComponent() {
  MethodComponent.apply(this, arguments);
}

oo.inherit(ConstructorComponent, MethodComponent);

module.exports = ConstructorComponent;
