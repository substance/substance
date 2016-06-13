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
    config.addLabel('inherited-from', 'Inherited from');
    config.addLabel('example', 'Example');
    config.addLabel('parameters', 'Parameters');
    config.addLabel('abstract-class', 'Abstract Class');
    config.addLabel('component', 'Component');
    config.addLabel('abstract-component', 'Abstract Component');
    config.addLabel('ctor', 'Constructor');
    config.addLabel('function', 'Function');
    config.addLabel('functions', 'Functions');
    config.addLabel('method', 'Method');
    config.addLabel('module', 'Module');
    config.addLabel('event', 'Event');
    config.addLabel('defined-in', 'defined in');
    config.addLabel('returns', 'Returns');
    config.addLabel('extends', 'inherits from');
    config.addLabel('inner-classes', 'Inner Classes');
    config.addLabel('class-properties', 'Class properties');
    config.addLabel('class-methods', 'Class methods');
    config.addLabel('classes', 'Classes');
    config.addLabel('methods', 'Methods');
    config.addLabel('properties', 'Properties');
    config.addLabel('instance-methods', 'Methods');
    config.addLabel('instance-properties', 'Properties');
    config.addLabel('instance-events', 'Events');
    config.addLabel('inherited-instance-methods', 'Inherited Methods');
    config.addLabel('inherited-instance-properties', 'Inherited Properties');
    config.addLabel('inherited-class-properties', 'Inherited Class properties');
    config.addLabel('inherited-class-methods', 'Inherited Class methods');
    config.addLabel('props', 'Props');
    config.addLabel('state', 'State');
  }
};
