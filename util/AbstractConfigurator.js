'use strict';

var oo = require('./oo');
var forEach = require('lodash/forEach');
var map = require('lodash/map');
var extend = require('lodash/extend');
var isString = require('lodash/isString');
var DocumentSchema = require('../model/DocumentSchema');
var EditingBehavior = require('../model/EditingBehavior');
var Registry = require('../util/Registry');
var ComponentRegistry = require('../ui/ComponentRegistry');
var path = require('path');

/**
 * Abstract Configurator for Substance editors.
 *
 * @module
 */
function AbstractConfigurator() {
  this.config = {
    schema: {},
    nodes: {},
    components: {},
    converters: {},
    importers: {},
    exporters: {},
    commands: {},
    tools: {},
    textTypes: [],
    editingBehaviors: [],
    macros: [],
    dndHandlers: [],
    icons: {},
    labels: {}
  };
}

AbstractConfigurator.Prototype = function() {

  // Record phase API
  // ------------------------

  this.defineSchema = function(schema) {
    this.config.schema = schema;
  };

  /**
   * @param {String} NodeClass node class name.
   */
  this.addNode = function(NodeClass) {
    var type = NodeClass.type;
    if (!type) {
      throw new Error('A NodeClass must have a type.');
    }
    if (this.config.nodes[type]) {
      throw new Error('NodeClass with this type name is already registered: ' + name);
    }
    this.config.nodes[type] = NodeClass;
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

  this.addComponent = function(name, ComponentClass) {
    if (this.config.components[name]) {
      throw new Error(name+' already registered');
    }
    if (!ComponentClass || !ComponentClass.prototype._isComponent) {
      throw new Error('ComponentClass must be a subclass of ui/Component.');
    }
    this.config.components[name] = ComponentClass;
  };

  this.addCommand = function(name, CommandClass, options) {
    if (!isString(name)) {
      throw new Error("Expecting 'name' to be a String");
    }
    if (!CommandClass.prototype._isCommand) {
      throw new Error("Expecting 'CommandClass' to be of type ui/Command.");
    }
    this.config.commands[name] = {
      name: name,
      CommandClass: CommandClass,
      options: options || {}
    };
  };

  this.addTool = function(name, ToolClass, options) {
    if (!isString(name)) {
      throw new Error("Expecting 'name' to be a String");
    }
    if (!ToolClass.prototype._isTool) {
      throw new Error("Expecting 'ToolClass' to be of type ui/Tool.");
    }
    this.config.tools[name] = {
      name: name,
      Class: ToolClass,
      options: options || {}
    };
  };

  this.addIcon = function(iconName, options) {
    var iconConfig = this.config.icons[iconName];
    if (!iconConfig) {
      iconConfig = {};
      this.config.icons[iconName] = iconConfig;
    }
    extend(iconConfig, options);
  };

  /**
    @param {String} labelName name of label.
    @param {String} label label.

    Define a new label
    label is either a string or a hash with translations.
    If string is provided 'en' is used as the language.
  */
  this.addLabel = function(labelName, label) {
    if (isString(label)) {
      if(!this.config.labels['en']) {
        this.config.labels['en'] = {};
      }
      this.config.labels['en'][labelName] = label;
    } else {
      forEach(label, function(label, lang) {
        if (!this.config.labels[lang]) {
          this.config.labels[lang] = {};
        }
        this.config.labels[lang][labelName] = label;
      }.bind(this));
    }
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

  this.addDragAndDrop = function(DragAndDropHandlerClass) {
    if (!DragAndDropHandlerClass.prototype._isDragAndDropHandler) {
      throw new Error('Only isntances of DragAndDropHandler are allowed.');
    }
    this.config.dndHandlers.push(DragAndDropHandlerClass);
  };

  this.import = function(pkg, options) {
    pkg.configure(this, options || {});
    return this;
  };

  // Config Interpreter APIs
  // ------------------------

  this.getConfig = function() {
    return this.config;
  };

  this.getStyles = function() {
    return this.config.styles;
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
    forEach(this.config.tools, function(item, name) {
      toolRegistry.add(name, item);
    });
    return toolRegistry;
  };

  this.getComponentRegistry = function() {
    var componentRegistry = new ComponentRegistry();
    forEach(this.config.components, function(ComponentClass, name) {
      componentRegistry.add(name, ComponentClass);
    });
    return componentRegistry;
  };

  this.getCommands = function() {
    return map(this.config.commands, function(item, name) {
      return new item.CommandClass(extend({name: name}, item.options));
    });
  };

  this.getSurfaceCommandNames = function() {
    var commands = this.getCommands();
    var commandNames = commands.map(function(C) {
      return C.type;
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

  this.getIconProvider = function() {
    throw new Error('This method is abstract');
  };

  this.getTextTypes = function() {
    return this.config.textTypes.map(function(t) {
      return t.spec;
    });
  };

  this.getLabelProvider = function() {
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

  this.createDragHandlers = function() {
    return this.config.dndHandlers.map(function(DragAndDropHandlerClass) {
      return new DragAndDropHandlerClass();
    });
  };

};

oo.initClass(AbstractConfigurator);

module.exports = AbstractConfigurator;
