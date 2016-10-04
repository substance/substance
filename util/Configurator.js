import forEach from 'lodash/forEach'
import map from 'lodash/map'
import isString from 'lodash/isString'
import DocumentSchema from '../model/DocumentSchema'
import EditingBehavior from '../model/EditingBehavior'
import Registry from '../util/Registry'
import ComponentRegistry from '../ui/ComponentRegistry'
import FontAwesomeIconProvider from '../ui/FontAwesomeIconProvider'
import LabelProvider from '../ui/DefaultLabelProvider'

/**
  Default Configurator for Substance editors. It provides an API for
  adding nodes to the schema, components, commands and tools etc.

  @class

  @example

  ```js
  let configurator = new Configurator()

  configurator.addNode(Heading)
  configurator.addComponent('heading', HeadingComponent)
  ```

  To modularize configuration, package definitions can be imported.

  ```js
  configurator.import(ParagraphPackage)
  ```

  You can create your own extensions that way.

  ```js

  const AlienPackage = {
    name: 'alien'
    configure: function(config) {
      config.addNode(AlienNode)
      config.addComponent('alien', AlienComponent)
      config.addCommand('add-alien', AddAlienCommand)
      config.addTool('add-alien', AddAlienTool)
    }
  }

  ```

  From within a package, another package can be imported. This provides
  a simple mechanism to model dependencies between packages. Just make
  sure you don't run into cyclic dependencies as there is no checking for
  that at the moment.
*/

/** INCLUDE_IN_API_DOCS */
class Configurator {
  constructor() {
    this.config = {
      schema: {},
      nodes: {},
      components: {},
      converters: {},
      importers: {},
      exporters: {},
      commands: {},
      tools: new Map(),
      textTypes: [],
      editingBehaviors: [],
      macros: [],
      dndHandlers: [],
      icons: {},
      labels: {}
    }
  }

  // Record phase API
  // ------------------------

  defineSchema(schema) {
    this.config.schema = schema
  }

  /**
   * @param {String} NodeClass node class name.
   */
  addNode(NodeClass) {
    var type = NodeClass.type
    if (!type) {
      throw new Error('A NodeClass must have a type.')
    }
    if (this.config.nodes[type]) {
      throw new Error('NodeClass with this type name is already registered: ' + name)
    }
    this.config.nodes[type] = NodeClass
  }

  addConverter(type, converter) {
    var converters = this.config.converters[type]
    if (!converters) {
      converters = {}
      this.config.converters[type] = converters
    }
    if (!converter.type) {
      throw new Error('A converter needs an associated type.')
    }
    converters[converter.type] = converter
  }

  addImporter(type, ImporterClass) {
    this.config.importers[type] = ImporterClass
  }

  addExporter(type, ExporterClass) {
    this.config.exporters[type] = ExporterClass
  }

  addComponent(name, ComponentClass) {
    if (this.config.components[name]) {
      throw new Error(name+' already registered')
    }
    if (!ComponentClass) {
      throw new Error('Provided nil for component '+name)
    }
    if (!ComponentClass.prototype._isComponent) {
      throw new Error('ComponentClass must be a subclass of ui/Component.')
    }
    this.config.components[name] = ComponentClass
  }

  addCommand(name, CommandClass, options) {
    if (!isString(name)) {
      throw new Error("Expecting 'name' to be a String")
    }
    if (!CommandClass) {
      throw new Error('Provided nil for command '+name)
    }
    if (!CommandClass.prototype._isCommand) {
      throw new Error("Expecting 'CommandClass' to be of type ui/Command.")
    }
    this.config.commands[name] = {
      name: name,
      CommandClass: CommandClass,
      options: options || {}
    }
  }

  addTool(name, ToolClass, options) {
    options = options || {};
    if (!isString(name)) {
      throw new Error("Expecting 'name' to be a String")
    }
    if (!ToolClass) {
      throw new Error('Provided nil for tool '+name)
    }
    if (!ToolClass || !ToolClass.prototype._isTool) {
      throw new Error("Expecting 'ToolClass' to be of type ui/Tool. name:")
    }
    var toolTarget = options.target
    if (!toolTarget && options.overlay) {
      toolTarget = 'overlay'
    } else if (!toolTarget) {
      toolTarget = 'default'
    }
    if (!this.config.tools.has(toolTarget)) {
      this.config.tools.set(toolTarget, new Map());
    }
    this.config.tools.get(toolTarget).set(name, {
      name: name,
      Class: ToolClass,
      options: options || {}
    })
  }

  addIcon(iconName, options) {
    var iconConfig = this.config.icons[iconName]
    if (!iconConfig) {
      iconConfig = {}
      this.config.icons[iconName] = iconConfig
    }
    Object.assign(iconConfig, options)
  }

  /**
    @param {String} labelName name of label.
    @param {String} label label.

    Define a new label
    Label is either a string or a hash with translations.
    If string is provided 'en' is used as the language.
  */
  addLabel(labelName, label) {
    if (isString(label)) {
      if(!this.config.labels['en']) {
        this.config.labels['en'] = {}
      }
      this.config.labels['en'][labelName] = label
    } else {
      forEach(label, function(label, lang) {
        if (!this.config.labels[lang]) {
          this.config.labels[lang] = {}
        }
        this.config.labels[lang][labelName] = label
      }.bind(this))
    }
  }

  /**
    @param seed Seed function.

    Define a seed function
    Seed function is a transaction function.

    @example

    ```js
    var seedFn = function(tx) {
      var body = tx.get('body');

      tx.create({
        id: 'p1',
        type: 'paragraph',
        content: 'This is your new paragraph!'
      });
      body.show('p1');
    };

    config.addSeed(seedFn);
    ```
  */

  addSeed(seed) {
    this.config.seed = seed
  }

  addTextType(textType, options) {
    this.config.textTypes.push({
      spec: textType,
      options: options || {}
    })
  }

  addEditingBehavior(editingBehavior) {
    this.config.editingBehaviors.push(editingBehavior)
  }

  addMacro(macro) {
    this.config.macros.push(macro)
  }

  addDragAndDrop(DragAndDropHandlerClass) {
    if (!DragAndDropHandlerClass.prototype._isDragAndDropHandler) {
      throw new Error('Only instances of DragAndDropHandler are allowed.')
    }
    this.config.dndHandlers.push(DragAndDropHandlerClass)
  }

  import(pkg, options) {
    pkg.configure(this, options || {})
    return this
  }

  // Config Interpreter APIs
  // ------------------------

  getConfig() {
    return this.config;
  }

  getStyles() {
    return this.config.styles
  }

  getSchema() {
    var schemaConfig = this.config.schema;
    // TODO: We may want to remove passing a schema version as
    // the version is defined by the repository / npm package version
    var schema = new DocumentSchema(schemaConfig.name, '1.0.0')
    schema.getDefaultTextType = function() {
      return schemaConfig.defaultTextType
    }
    schema.addNodes(this.config.nodes)
    return schema
  }

  createArticle(seed) {
    var schemaConfig = this.config.schema;
    var schema = this.getSchema()
    var doc = new schemaConfig.ArticleClass(schema)
    if (seed) {
      seed(doc)
    }
    return doc
  }

  createImporter(type) {
    var ImporterClass = this.config.importers[type]
    var config = {
      schema: this.getSchema(),
      converters: this.getConverterRegistry().get(type),
      DocumentClass: this.config.schema.ArticleClass
    }
    return new ImporterClass(config)
  }

  createExporter(type) {
    var ExporterClass = this.config.exporters[type]
    var config = {
      schema: this.getSchema(),
      converters: this.getConverterRegistry().get(type)
    }
    return new ExporterClass(config)
  }

  getTools() {
    return this.config.tools;
  }

  getComponentRegistry() {
    var componentRegistry = new ComponentRegistry()
    forEach(this.config.components, function(ComponentClass, name) {
      componentRegistry.add(name, ComponentClass)
    })
    return componentRegistry
  }

  getCommands() {
    return map(this.config.commands, function(item, name) {
      return new item.CommandClass(Object.assign({name: name}, item.options))
    })
  }

  getSurfaceCommandNames() {
    var commands = this.getCommands()
    var commandNames = commands.map(function(C) {
      return C.type
    })
    return commandNames
  }

  /*
    A converter registry is a registry by file type and then by node type

    `configurator.getConverterRegistry().get('html').get('paragraph')` provides
    a HTML converter for Paragraphs.
  */
  getConverterRegistry() {
    if (!this.converterRegistry) {
      var converterRegistry = new Registry()
      forEach(this.config.converters, function(converters, name) {
        converterRegistry.add(name, new Registry(converters))
      })
      this.converterRegistry = converterRegistry
    }
    return this.converterRegistry
  }

  getSeed() {
    return this.config.seed
  }

  getTextTypes() {
    return this.config.textTypes.map(function(t) {
      return t.spec
    })
  }

  getIconProvider() {
    return new FontAwesomeIconProvider(this.config.icons)
  }

  getLabelProvider() {
    return new LabelProvider(this.config.labels)
  }

  getEditingBehavior() {
    var editingBehavior = new EditingBehavior()
    this.config.editingBehaviors.forEach(function(behavior) {
      behavior.register(editingBehavior)
    })
    return editingBehavior
  }

  getMacros() {
    return this.config.macros
  }

  createDragHandlers() {
    return this.config.dndHandlers.map(function(DragAndDropHandlerClass) {
      return new DragAndDropHandlerClass()
    })
  }
}

export default Configurator
