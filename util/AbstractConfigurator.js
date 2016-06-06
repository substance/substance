'use strict';

var oo = require('./oo');
var forEach = require('lodash/forEach');
var extend = require('lodash/extend');
var DocumentSchema = require('../model/DocumentSchema');
var EditingBehavior = require('../model/EditingBehavior');
var Registry = require('../util/Registry');
var FileClientStub = require('../ui/FileClientStub');
var SaveHandlerStub = require('../ui/SaveHandlerStub');

/*
  Abstract Configurator for Substance editors.
*/
function AbstractConfigurator() {
  this.config = {
    schema: {},
    styles: [],
    nodes: {},
    components: {},
    converters: {},
    importers: {},
    exporters: {},
    commands: [],
    tools: [],
    textTypes: [],
    editingBehaviors: [],
    macros: [],
    icons: {},
    saveHandler: SaveHandlerStub,
    fileClient: FileClientStub
  };
}

AbstractConfigurator.Prototype = function() {

  // Record phase API
  // ------------------------

  this.defineSchema = function(schema) {
    this.config.schema = schema;
  };

  this.addNode = function(NodeClass) {
    var name = NodeClass.static.name;
    if (!name) {
      throw new Error('A NodeClass must have a name.');
    }
    if (this.config.nodes[name]) {
      throw new Error('NodeClass with this name is already registered: ' + name);
    }
    this.config.nodes[name] = NodeClass;
  };

  this.addConverter = function(type, converter) {
    var converters = this.config.converters[type];
    if (!converters) {
      converters = {};
      this.config.converters[type] = converters;
    }
    if (!converter.type) {
      throw new Error('A converter needs an associated type.');
    }
    converters[converter.type] = converter;
  };

  this.addImporter = function(type, ImporterClass) {
    this.config.importers[type] = ImporterClass;
  };

  this.addExporter = function(type, ExporterClass) {
    this.config.exporters[type] = ExporterClass;
  };

  this.addStyle = function(sassFilePath) {
    this.config.styles.push(sassFilePath);
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

  this.addIcon = function(iconName, options) {
    var iconConfig = this.config.icons[iconName];
    if (!iconConfig) {
      iconConfig = {};
      this.config.icons[iconName] = iconConfig;
    }
    extend(iconConfig, options);
  };

  this.addTextType = function(textType, options) {
    this.config.textTypes.push({
      spec: textType,
      options: options || {}
    });
  };

  this.addEditingBehavior = function(editingBehavior) {
    this.config.editingBehaviors.push(editingBehavior);
  };

  this.addMacro = function(macro) {
    this.config.macros.push(macro);
  };

  this.setSaveHandler = function(saveHandler) {
    this.config.saveHandler = saveHandler;
  };

  this.setFileClient = function(fileClient) {
    this.config.fileClient = fileClient;
  };

  this.import = function(pkg, options) {
    pkg.configure(this, options || {});
  };

  // Config Interpreter APIs
  // ------------------------

  this.getConfig = function() {
    return this.config;
  };

  this.getSchema = function() {
    var schemaConfig = this.config.schema;
    // TODO: We may want to remove passing a schema version as
    // the version is defined by the repository / npm package version
    var schema = new DocumentSchema(schemaConfig.name, '1.0.0');
    schema.getDefaultTextType = function() {
      return schemaConfig.defaultTextType;
    };

    schema.addNodes(this.config.nodes);
    return schema;
  };

  this.createArticle = function(seed) {
    var schemaConfig = this.config.schema;

    var schema = this.getSchema();
    var doc = new schemaConfig.ArticleClass(schema);
    if (seed) {
      seed(doc);
    }
    return doc;
  };

  this.createImporter = function(type) {
    var ImporterClass = this.config.importers[type];
    var config = {
      schema: this.getSchema(),
      converters: this.getConverterRegistry().get(type),
      DocumentClass: this.config.schema.ArticleClass
    };

    return new ImporterClass(config);
  };

  this.createExporter = function(type) {
    var ExporterClass = this.config.exporters[type];
    var config = {
      schema: this.getSchema(),
      converters: this.getConverterRegistry().get(type)
    };
    return new ExporterClass(config);
  };

  this.getToolRegistry = function() {
    var toolRegistry = new Registry();
    forEach(this.config.tools, function(tool) {
      toolRegistry.add(tool.Class.static.name, tool);
    });
    return toolRegistry;
  };

  this.getComponentRegistry = function() {
    var componentRegistry = new Registry();
    forEach(this.config.components, function(ComponentClass, name) {
      componentRegistry.add(name, ComponentClass);
    });
    return componentRegistry;
  };

  this.getCommands = function() {
    var commands = this.config.commands;
    var CommandClasses = commands.map(function(c) {
      return c.Class;
    });
    return CommandClasses;
  };

  this.getSurfaceCommandNames = function() {
    var commands = this.getCommands();
    var commandNames = commands.map(function(C) {
      return C.static.name;
    });
    return commandNames;
  };

  /*
    A converter registry is a registry by file type and then by node type

    `configurator.getConverterRegistry().get('html').get('paragraph')` provides
    a HTML converter for Paragraphs.
  */
  this.getConverterRegistry = function() {
    if (!this.converterRegistry) {
      var converterRegistry = new Registry();
      forEach(this.config.converters, function(converters, name) {
        converterRegistry.add(name, new Registry(converters));
      });
      this.converterRegistry = converterRegistry;
    }
    return this.converterRegistry;
  };

  this.getFileClient = function() {
    var FileClientClass = this.config.fileClient;
    return new FileClientClass();
  };

  this.getSaveHandler = function() {
    var SaveHandlerClass = this.config.saveHandler;
    return new SaveHandlerClass();
  };

  this.getIconProvider = function() {
    throw new Error('This method is abstract');
  };

  this.getTextTypes = function() {
    return this.config.textTypes.map(function(t) {
      return t.spec;
    });
  };

  this.getI18nInstance = function() {
    throw new Error('This method is abstract.');
  };

  this.getEditingBehavior = function() {
    var editingBehavior = new EditingBehavior();
    this.config.editingBehaviors.forEach(function(behavior) {
      behavior.register(editingBehavior);
    });
    return editingBehavior;
  };

  this.getMacros = function() {
    return this.config.macros;
  };
};

oo.initClass(AbstractConfigurator);

module.exports = AbstractConfigurator;
