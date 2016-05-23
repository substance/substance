'use strict';

var oo = require('./oo');

function Configurator() {
  // All data will be collected here
  this.config = {
    nodes: [],
    components: {},
    converters: [],
    commands: [],
    tools: [],
    textTypes: []
  };
}

Configurator.Prototype = function() {
  this.addNode = function(NodeClass) {
    // TODO: check if already registered
    this.config.nodes.push(NodeClass);
  };

  this.addConverter = function(ConverterClass) {
    // TODO: check if already registered
    this.config.converters.push(ConverterClass);
  };

  this.addComponent = function(name, ComponentClass) {
    if (this.config.components[name]) {
      throw new Error(name+' already registered');
    }
    this.config.components[name] = ComponentClass;
  };

  this.addCommand = function(CommandClass, options) {
    this.config.commands.push({
      Class: CommandClass,
      options: options || {}
    });
  };

  this.addTool = function(ToolClass, options) {
    this.config.tools.push({
      Class: ToolClass,
      options: options || {}
    });
  };

  this.addTextType = function(textType, options) {
    this.config.textTypes.push({
      spec: textType,
      options: options || {}
    });
  };

  this.import = function(configFn, options) {
    configFn(this, options || {});
  };

  this.getConfig = function() {
    return this.config;
  };
};

oo.initClass(Configurator);

module.exports = Configurator;
