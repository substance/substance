import forEach from './forEach'
import map from './map'
import isString from './isString'
import DocumentSchema from '../model/DocumentSchema'
import EditingBehavior from '../model/EditingBehavior'
import Registry from '../util/Registry'
import ComponentRegistry from '../ui/ComponentRegistry'
import FontAwesomeIconProvider from '../ui/FontAwesomeIconProvider'
import LabelProvider from '../ui/DefaultLabelProvider'
import ToolGroup from '../packages/tools/ToolGroup'
import SaveHandlerStub from '../packages/persistence/SaveHandlerStub'

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
class Configurator {
  constructor() {
    this.config = {
      schema: {},
      nodes: {},
      components: {},
      converters: {},
      importers: {},
      exporters: {},
      fileProxies: [],
      commands: {},
      tools: new Map(),
      toolGroups: new Map(),
      textTypes: [],
      editingBehaviors: [],
      macros: [],
      dropHandlers: [],
      keyboardShortcuts: [],
      icons: {},
      labels: {},
      lang: 'en_US',
      SaveHandlerClass: null
    }
  }

  // Record phase API
  // ------------------------

  /**
    Defines the document schema for this configuration.

    @param  {DocumentSchema} schema A schema to be used for articles created
        from this configuration.
   */
  defineSchema(schema) {
    this.config.schema = schema
  }

  /**
    Adds a node to this configuration. Later, when you use
    {@link Configurator#getSchema()}, this node will be added to that schema.
    Usually, used within a package to add its own nodes to the schema.

    @param {Node} NodeClass
   */
  addNode(NodeClass) {
    var type = NodeClass.type
    if (!type) {
      throw new Error('A NodeClass must have a type.')
    }
    if (this.config.nodes[type]) {
      throw new Error('NodeClass with this type name is already registered: ' + type)
    }
    this.config.nodes[type] = NodeClass
  }

  /**
    Adds a converter for a conversion format.

    @param {string} type      a conversion format type, eg. 'html', 'xml', 'json'
    @param {Object} converter a converter for that format.
   */
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

  /**
    Add importer for a conversion format.

    @param {string} type          a conversion format type. eg. 'html', 'xml'
    @param {Object} ImporterClass an importer for the conversion format.
   */
  addImporter(type, ImporterClass) {
    this.config.importers[type] = ImporterClass
  }

  /**
    Add exporter for a conversion format.

    @param {string} type          a conversion format type. eg. 'html', 'xml'
    @param {Object} ExporterClass an exporter for the conversion format.
   */
  addExporter(type, ExporterClass) {
    this.config.exporters[type] = ExporterClass
  }

  /**
    Add a component for a node type. Components ({@link Component}) are the
    ui representation of a node for rendering and manipulation. This is usually
    used within a package to add representations for nodes added by that
    package.

    A component can be added once per nodeType. If you provide two components
    for the same node type, Substance can't figure out which one to use.

    @param {String} nodeType       the type attribute of the node for which this
                                   component is to be used.
    @param {Class} ComponentClass  A subclass of {@link Component} for nodes
                                   of nodeType.
   */
  addComponent(nodeType, ComponentClass, force) {
    if (!force && this.config.components[nodeType]) {
      throw new Error(nodeType+' already registered')
    }
    if (!ComponentClass) {
      throw new Error('Provided nil for component '+nodeType)
    }
    if (!ComponentClass.prototype._isComponent) {
      throw new Error('ComponentClass must be a subclass of ui/Component.')
    }
    this.config.components[nodeType] = ComponentClass
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

  addToolGroup(name, ToolGroupClass, options) {
    options = options || {}
    ToolGroupClass = ToolGroupClass || ToolGroup

    this.config.toolGroups.set(name, {
      name: name,
      tools: new Map(),
      Class: ToolGroupClass,
      options: options
    })
  }

  addTool(name, ToolClass, options) {
    options = options || {}

    if (options.target) {
      console.warn('DEPRECATED: please use `toolGroup` instead of `target`', name)
    }
    let toolGroupNames = options.toolGroup || options.target
    if (isString(toolGroupNames)) {
      toolGroupNames = [ toolGroupNames ]
    }

    if (!toolGroupNames && options.overlay) {
      toolGroupNames = [ 'overlay' ]
    } else if (!toolGroupNames) {
      toolGroupNames = [ 'default' ]
    }

    if (!isString(name)) {
      throw new Error("Expecting 'name' to be a String")
    }
    if (!ToolClass) {
      throw new Error('Provided nil for tool '+name)
    }
    if (!ToolClass || !ToolClass.prototype._isTool) {
      throw new Error("Expecting 'ToolClass' to be of type ui/Tool. name:")
    }

    toolGroupNames.forEach((toolGroupName) => {
      let toolGroup = this.config.toolGroups.get(toolGroupName)
      if (!toolGroup) {
        console.error(`No toolGroup registered with name: ${toolGroupName}`)
        return
      }
      toolGroup.tools.set(name, {
        name: name,
        Class: ToolClass,
        options: options || {}
      })
    })
  }

  /**
    Adds an icon to the configuration which can be later retrieved via the
    iconProvider.

    @param {string} iconName name or key for retrieving the icon
    @param {Object} options  your custom method of representing the icon as a
        JSON object. Enables plugging in your own IconProvider.
   */
  addIcon(iconName, options) {
    var iconConfig = this.config.icons[iconName]
    if (!iconConfig) {
      iconConfig = {}
      this.config.icons[iconName] = iconConfig
    }
    Object.assign(iconConfig, options)
  }

  /**
    Define a new label
    Label is either a string or a hash with translations.
    If string is provided 'en' is used as the language.

    @param {String} labelName name of label.
    @param {String} label label.

    @example

    ```
    // Using english only.
    config.addLabel('paragraph.content', 'Paragraph')

    // Using multiple languages
    config.addLabel('superscript', {
      en: 'Superscript',
      de: 'Hochgestellt'
    })

    .
    .
    // Usage within other code
    let labels = this.context.labelProvider
    $$('span').append(labels.getLabel('superscript'))
    ```
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
    Replaces the seed function for this configuration.

    Use a seed function to create the empty state for your document. This should
    be used only once per configuration. You shouldn't call this within package
    config methods.

    You can use {@link Configurator#getSeed} method to get this seed and
    apply it on your document {@link Document} class.

    @param {function} seed   A transaction function that creates the seed
        document from an empty document.

    @example

    ```js
    var seedFn = function(tx) {
      var body = tx.get('body')

      tx.create({
        id: 'p1',
        type: 'paragraph',
        content: 'This is your new paragraph!'
      })
      body.show('p1')
    }

    config.addSeed(seedFn)
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

  /**
    Adds an editing behavior to this configuration. {@link EditingBehavior}
    for more.

    @param {EditingBehavior} editingBehavior.
   */
  addEditingBehavior(editingBehavior) {
    this.config.editingBehaviors.push(editingBehavior)
  }

  addMacro(macro) {
    this.config.macros.push(macro)
  }

  addDragAndDrop(DragAndDropHandlerClass) {
    // we deprecated this after it became more clear what
    // we actually needed to solve
    console.warn('DEPRECATED: Use addDropHandler() instead')
    if (!DragAndDropHandlerClass.prototype._isDragAndDropHandler) {
      throw new Error('Only instances of DragAndDropHandler are allowed.')
    }
    this.addDropHandler(new DragAndDropHandlerClass())
  }

  addDropHandler(dropHandler) {
    // legacy
    if (dropHandler._isDragAndDropHandler) {
      dropHandler.type = dropHandler.type || 'drop-asset'
    }
    this.config.dropHandlers.push(dropHandler)
  }

  addKeyboardShortcut(combo, spec) {
    let entry = {
      key: combo,
      spec: spec
    }
    this.config.keyboardShortcuts.push(entry)
  }

  addFileProxy(FileProxyClass) {
    this.config.fileProxies.push(FileProxyClass)
  }

  getFileAdapters() {
    return this.config.fileProxies.slice(0)
  }

  /**
    Configure this instance of configuration for provided package.
    @param  {Object} pkg     Object should contain a `configure` method that
                             takes a Configurator instance as the first method.
    @param  {Object} options Additional options to pass to the
                             package.`configure` method

    @return {configurator}   returns the configurator instance to make it easy
                             to chain calls to import.
   */
  import(pkg, options) {
    pkg.configure(this, options || {})
    return this
  }

  // Config Interpreter APIs
  // ------------------------

  getConfig() {
    return this.config
  }

  getStyles() {
    return this.config.styles
  }

  getSchema() {
    var schemaConfig = this.config.schema
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
    var schemaConfig = this.config.schema
    var schema = this.getSchema()
    var doc = new schemaConfig.ArticleClass(schema)
    if (seed) {
      seed(doc)
    }
    return doc
  }

  createImporter(type, context, options = {}) {
    var ImporterClass = this.config.importers[type]
    var config = Object.assign({
      schema: this.getSchema(),
      converters: this.getConverterRegistry().get(type),
      DocumentClass: this.config.schema.ArticleClass
    }, options)
    return new ImporterClass(config, context)
  }

  createExporter(type, context, options = {}) {
    var ExporterClass = this.config.exporters[type]
    var config = Object.assign({
      schema: this.getSchema(),
      converters: this.getConverterRegistry().get(type)
    }, options)
    return new ExporterClass(config, context)
  }

  getToolGroups() {
    return this.config.toolGroups
  }

  getTools(toolGroupName) {
    return this.config.toolGroups.get(toolGroupName).tools
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

  getDropHandlers() {
    return this.config.dropHandlers.slice(0)
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

  getKeyboardShortcuts() {
    return this.config.keyboardShortcuts
  }

  setDefaultLanguage(lang) {
    this.config.lang = lang
  }

  getDefaultLanguage() {
    return this.config.lang || 'en_US'
  }

  setSaveHandlerClass(SaveHandlerClass) {
    this.config.SaveHandlerClass = SaveHandlerClass
  }

  getSaveHandler() {
    let SaveHandler = this.config.SaveHandlerClass || SaveHandlerStub
    return new SaveHandler()
  }
}

export default Configurator
