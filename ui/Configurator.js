import forEach from '../util/forEach'
import map from '../util/map'
import isString from '../util/isString'
import Registry from '../util/Registry'
import platform from '../util/platform'
import DocumentSchema from '../model/DocumentSchema'
import EditingBehavior from '../model/EditingBehavior'
import ComponentRegistry from './ComponentRegistry'

import FontAwesomeIconProvider from './FontAwesomeIconProvider'

import DefaultCommandManager from './CommandManager'
import DefaultDragManager from './DragManager'
import DefaultFileManager from './FileManager'
import DefaultGlobalEventHandler from './GlobalEventHandler'
import DefaultKeyboardManager from './KeyboardManager'
import DefaultMacroManager from './MacroManager'
import DefaultMarkersManager from './MarkersManager'
import DefaultSurfaceManager from './SurfaceManager'
import DefaultSaveHandler from '../packages/persistence/SaveHandlerStub'
import DefaultLabelProvider from './DefaultLabelProvider'

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
      tools: {},
      components: {},
      converters: {},
      importers: {},
      exporters: {},
      fileProxies: [],
      commands: {},
      commandGroups: {},
      toolPanels: {},
      editingBehaviors: [],
      macros: [],
      managers: {},
      dropHandlers: [],
      keyboardShortcuts: [],
      icons: {},
      labels: {},
      lang: 'en',
      editorOptions: [],
      CommandManagerClass: DefaultCommandManager,
      DragManagerClass: DefaultDragManager,
      SaveHandlerClass: null,
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
    if (schema.ArticleClass) {
      console.warn('DEPRECATED: schema.ArticleClass is now called schema.DocumentClass')
      schema.DocumentClass = schema.ArticleClass
    }
    if (!schema.DocumentClass) {
      throw new Error('schema.DocumentClass is mandatory')
    }
    this.config.schema = schema
  }

  addEditorOption(option) {
    if (!option.key) {
      throw new Error('An option key must be defined')
    }
    if (!option.value) {
      throw new Error('An option value must be defined')
    }
    this.config.editorOptions[option.key] = option.value
  }

  getEditorOptions() {
    return this.config.editorOptions
  }

  /**
    Adds a node to this configuration. Later, when you use
    {@link Configurator#getSchema()}, this node will be added to that schema.
    Usually, used within a package to add its own nodes to the schema.

    @param {Node} NodeClass
   */
  addNode(NodeClass, override) {
    let type = NodeClass.type
    if (!type) {
      throw new Error('A NodeClass must have a type.')
    }
    if (this.config.nodes[type] && !override) {
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
    options = options || {}
    if (this.config.commands[name] && !options.force) {
      throw new Error(`Another command with name ${name} has already been registered. Use 'options.force' if this is intentional.`)
    }
    this.config.commands[name] = {
      name,
      CommandClass,
      options
    }

    // Register commandGroup entry
    let commandGroup = options.commandGroup
    if (commandGroup) {
      if (!this.config.commandGroups[commandGroup]) {
        this.config.commandGroups[commandGroup] = []
      }
      this.config.commandGroups[commandGroup].push(name)
    }
  }

  addTool(name, ToolClass) {
    if (!isString(name)) {
      throw new Error("Expecting 'name' to be a String")
    }
    if (!ToolClass) {
      throw new Error('Provided nil for tool '+name)
    }
    if (!ToolClass || !ToolClass.prototype._isTool) {
      throw new Error("Expecting 'ToolClass' to be of type ui/Tool. name:", name)
    }

    this.config.tools[name] = ToolClass
  }

  getTools() {
    return this.config.tools
  }

  addToolPanel(name, spec) {
    this.config.toolPanels[name] = spec
  }

  getToolPanel(name) {
    return this.config.toolPanels[name]
  }

  addManager(name, ManagerClass) {
    this.config.managers[name] = ManagerClass
  }

  getManagers() {
    return this.config.managers
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
    if (!this.schema) {
      this.schema = new DocumentSchema(this.config.schema)
      this.schema.addNodes(this.config.nodes)
    }
    return this.schema
  }

  getDocumentClass() {
    return this.config.schema.DocumentClass
  }

  createArticle(seed) {
    console.warn('DEPRECATED: createArticle is now called createDocument')
    return this.createDocument(seed)
  }

  createDocument(seed) {
    const schema = this.getSchema()
    const DocumentClass = schema.getDocumentClass()
    let doc = new DocumentClass(schema)
    if (seed) {
      seed(doc)
    }
    return doc
  }

  createImporter(type, context, options = {}) {
    var ImporterClass = this.config.importers[type]
    var config = Object.assign({
      schema: this.getSchema(),
      converters: this.getConverterRegistry().get(type).values(),
    }, options)
    return new ImporterClass(config, context)
  }

  createExporter(type, context, options = {}) {
    var ExporterClass = this.config.exporters[type]
    var config = Object.assign({
      schema: this.getSchema(),
      converters: this.getConverterRegistry().get(type).values()
    }, options)
    return new ExporterClass(config, context)
  }

  getCommandGroups() {
    return this.config.commandGroups
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
      return C.name
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

  getIconProvider() {
    return new FontAwesomeIconProvider(this.config.icons)
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

  getFindAndReplaceConfig() {
    return this.config.findAndReplace
  }

  setFindAndReplaceConfig(config) {
    this.config.findAndReplace = config
  }

  /*
    Allows lookup of a keyboard shortcut by command name
  */
  getKeyboardShortcutsByCommand() {
    let keyboardShortcuts = {}
    this.config.keyboardShortcuts.forEach((entry) => {
      if (entry.spec.command) {
        let shortcut = entry.key.toUpperCase()

        if (platform.isMac) {
          shortcut = shortcut.replace(/CommandOrControl/i, '⌘')
          shortcut = shortcut.replace(/Ctrl/i, '^')
          shortcut = shortcut.replace(/Shift/i, '⇧')
          shortcut = shortcut.replace(/Enter/i, '↵')
          shortcut = shortcut.replace(/Alt/i, '⌥')
          shortcut = shortcut.replace(/\+/g, '')
        } else {
          shortcut = shortcut.replace(/CommandOrControl/i, 'Ctrl')
        }

        keyboardShortcuts[entry.spec.command] = shortcut
      }
    })
    return keyboardShortcuts
  }

  setDefaultLanguage(lang) {
    this.config.lang = lang
  }

  getDefaultLanguage() {
    return this.config.lang || 'en'
  }

  /* This is used for DependencyInjection of core implementations */

  setCommandManagerClass(CommandManagerClass) {
    this.config.CommandManagerClass = CommandManagerClass
  }

  getCommandManagerClass() {
    return this.config.CommandManagerClass || DefaultCommandManager
  }

  setDragManagerClass(DragManagerClass) {
    this.config.DragManagerClass = DragManagerClass
  }

  getDragManagerClass() {
    return this.config.DragManagerClass || DefaultDragManager
  }

  setFileManagerClass(FileManagerClass) {
    this.config.FileManagerClass = FileManagerClass
  }

  getFileManagerClass() {
    return this.config.FileManagerClass || DefaultFileManager
  }

  setGlobalEventHandlerClass(GlobalEventHandlerClass) {
    this.config.GlobalEventHandlerClass = GlobalEventHandlerClass
  }

  getGlobalEventHandlerClass() {
    return this.config.GlobalEventHandlerClass || DefaultGlobalEventHandler
  }

  setKeyboardManagerClass(KeyboardManagerClass) {
    this.config.KeyboardManagerClass = KeyboardManagerClass
  }

  getKeyboardManagerClass() {
    return this.config.KeyboardManagerClass || DefaultKeyboardManager
  }

  setMacroManagerClass(MacroManagerClass) {
    this.config.MacroManagerClass = MacroManagerClass
  }

  getMacroManagerClass() {
    return this.config.MacroManagerClass || DefaultMacroManager
  }

  setMarkersManagerClass(MarkersManagerClass) {
    this.config.MarkersManagerClass = MarkersManagerClass
  }

  getMarkersManagerClass() {
    return this.config.MarkersManagerClass || DefaultMarkersManager
  }

  setSurfaceManagerClass(SurfaceManagerClass) {
    this.config.SurfaceManagerClass = SurfaceManagerClass
  }

  getSurfaceManagerClass() {
    return this.config.SurfaceManagerClass || DefaultSurfaceManager
  }

  setSaveHandlerClass(SaveHandlerClass) {
    this.config.SaveHandlerClass = SaveHandlerClass
  }

  getSaveHandler() {
    let SaveHandler = this.config.SaveHandlerClass || DefaultSaveHandler
    return new SaveHandler()
  }

  getLabelProviderClass() {
    return this.config.LabelProviderClass || DefaultLabelProvider
  }

  setLabelProviderClass(LabelProviderClass) {
    this.config.LabelProviderClass = LabelProviderClass
  }

  getLabelProvider() {
    const LabelProvider = this.getLabelProviderClass()
    return new LabelProvider(this.config.labels)
  }

}

export default Configurator
