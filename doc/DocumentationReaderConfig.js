'use strict';

module.exports = {
  name: 'documentation-reader',
  configure: function(config) {
    config.addComponent('namespace', require('./components/NamespaceComponent'));
    config.addComponent('function', require('./components/FunctionComponent'));
    config.addComponent('class', require('./components/SubstanceClassComponent'));
    config.addComponent('ctor', require('./components/ConstructorComponent'));
    config.addComponent('method', require('./components/MethodComponent'));
    config.addComponent('module', require('./components/ModuleComponent'));
    config.addComponent('property', require('./components/PropertyComponent'));
    config.addComponent('event', require('./components/EventComponent'));
  }
};
