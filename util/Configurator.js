'use strict';

var oo = require('./oo');
var each = require('lodash/forEach');
var DocumentSchema = require('../model/DocumentSchema');
var Registry = require('../util/Registry');
var FileClientStub = require('../ui/FileClientStub');
var SaveHandlerStub = require('../ui/SaveHandlerStub');

// Setup default I18n
var I18n = require('../ui/i18n');

/*
  Default Configurator for Substance editors

  This works well for single-column apps (such as ProseEditor). 
  Write your own Configurator for apps that require more complex
  configuration (e.g. when there are multiple surfaces involved
  each coming with different textTypes, enabled commands etc.)
*/
function Configurator() {
  // All data will be collected here
  this.config = {
    schema: {},
    styles: [],
    nodes: [],
    components: {},
    converters: [],
    commands: [],
    tools: [],
    textTypes: [],
    saveHandler: SaveHandlerStub,
    fileClient: FileClientStub
  };
}

Configurator.Prototype = function() {

  // Record phase API
  // ------------------------

  this.defineSchema = function(schema) {
    this.config.schema = schema;
  };

  this.addNode = function(NodeClass) {
    // TODO: check if already registered
    this.config.nodes.push(NodeClass);
  };

  this.addConverter = function(ConverterClass) {
    // TODO: check if already registered
    this.config.converters.push(ConverterClass);
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

  this.addTextType = function(textType, options) {
    this.config.textTypes.push({
      spec: textType,
      options: options || {}
    });
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

  this.createArticle = function(seed) {
    var schemaConfig = this.config.schema;

    // TODO: We may want to remove passing a schema version as
    // the version is defined by the repository / npm package version
    var schema = new DocumentSchema(schemaConfig.name, '1.0.0');

    schema.getDefaultTextType = function() {
      return schemaConfig.defaultTextType;
    };

    schema.addNodes(this.config.nodes);

    var doc = new schemaConfig.ArticleClass(schema);
    if (seed) {
      seed(doc);
    }
    return doc;
  };

  this.getToolRegistry = function() {
    // Configure tool registry
    var toolRegistry = new Registry();
    each(this.config.tools, function(tool) {
      toolRegistry.add(tool.Class.static.name, tool);
    });
    return toolRegistry;
  };

  this.getComponentRegistry = function() {
    var componentRegistry = new Registry();
    each(this.config.components, function(ComponentClass, name) {
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

  this.getFileClient = function() {
    var FileClientClass = this.config.fileClient;
    return new FileClientClass();
  };

  this.getSaveHandler = function() {
    var SaveHandlerClass = this.config.saveHandler;
    return new SaveHandlerClass();
  };

  this.getTextTypes = function() {
    return this.config.textTypes.map(function(t) {
      return t.spec;
    });
  };

  this.getI18nInstance = function() {
    return I18n.instance;
  };

};

oo.initClass(Configurator);

module.exports = Configurator;
