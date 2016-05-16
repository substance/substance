'use strict';

var isArray = require('lodash/isArray');
var each = require('lodash/each');
var extend = require('lodash/extend');
var mergeWith = require('lodash/mergeWith');
var warn = require('../util/warn');
var Registry = require('../util/Registry');
var Logger = require ('../util/Logger');
var DocumentSession = require('../model/DocumentSession');
var Component = require('./Component');
var SurfaceManager = require('./SurfaceManager');
var ToolManager = require('./ToolManager');

// Setup default I18n
var I18n = require('./i18n');
I18n.instance.load(require('../i18n/en'));

/**
  Controls Substance infrastructure. Needs to be supplied as a top level instance
  to serve editors, commands and tools as a context.

  In order to construct a controller, you need to have a document instance ready,
  as well as a set of components and commands that you want your app to support.
  A controller can manage one or more editing surfaces.

  The controller is the interface for your app to trigger editor actions. For
  instance from any component, not only from a predefined toolbar commands
  can be executed on the controller to update the document.

  @class
  @component
  @abstract

  @example

  We utilize a custom {@link ui/Toolbar} and a configured {@link ui/ContainerEditor}.
  Check out the [examples](https://github.com/substance/examples) for complete usage.

   as a `Toolbar` including tools like the `UndoTool` and a configured `ContainerEditor`, which will do the actual editing work.

  ```js
  var ProseEditor = Controller.extend({
    // Editor configuration
    static: {
      config: CONFIG,
    },
    // Custom Render method for your editor
    render: function() {
      var config = getConfig();
      return $$('div').addClass('sc-prose-editor').append(
        $$(Toolbar).append(
          $$(Toolbar.Group).append(
            $$(TextTool, {'title': this.i18n.t('switch_text')}),
            $$(EmphasisTool).append($$(Icon, {icon: "fa-italic"}))
          )
        ),
        $$(ContainerEditor, {
          doc: this.props.doc,
          containerId: 'body',
          name: 'bodyEditor',
          commands: config.bodyEditor.commands
        }).ref('bodyEditor')
      );
    }
  });
  ```

  There's also a config object that is essential for the editor to work. The following
  configuration sets up a component registry that assigns a visual component to each
  content node type and defines which commands should be supported on the contorller
  level.

  ```js
  var CONFIG = {
    controller: {
      // Component registry
      components: {
        'paragraph': require('substance/packages/paragraph/ParagraphComponent'),
        ...
      },
      // Controller commands
      commands: [
        require('substance/ui/commands/undo'),
        require('substance/ui/commands/redo'),
        require('substance/ui/commands/save')
      ]
    },
    // Add custom configuration to this object
  };
  ```
*/
function Controller() {
  Component.apply(this, arguments);

  this.surfaceManager = null;
  this.stack = [];
  this.logger = new Logger();

  this._initializeController(this.props);

  // initial state mapping
  this.handleStateUpdate(this.state);
}

Controller.Prototype = function() {

  /**
   * Defines the child context. You should override this to provide your own contexts.
   *
   * @return {object} the child context
   */
  this.getChildContext = function() {
    return {
      config: this.getConfig(),
      controller: this,
      documentSession: this.documentSession,
      doc: this.doc,
      componentRegistry: this.componentRegistry,
      surfaceManager: this.surfaceManager,
      toolManager: this.toolManager,
      i18n: I18n.instance
    };
  };

  this.willReceiveProps = function(nextProps) {
    var newSession = nextProps.documentSession;
    var newDoc = nextProps.doc;
    var shouldDispose = (
      (newSession && newSession !== this.documentSession) ||
      (newDoc && newDoc !== this.doc)
    );
    if (shouldDispose) {
      this._disposeController();
      this._initializeController(nextProps);
    }
  };

  /**
    Is called when component life ends. If you need to implement dispose
    in your custom Controller class, don't forget the super call.
  */
  this.dispose = function() {
    this._disposeController();
  };

  /**
   * Render method of the controller component. This needs to be implemented by the
   * custom Controller class.
   *
   * @abstract
   * @return {ui/VirtualElement} virtual element created using $$
   */
  this.render = function($$) {
    return $$('div')
      .addClass('sc-controller')
      .on('keydown', this.handleApplicationKeyCombos);
  };

  this._initializeController = function(props) {
    // Either takes a DocumentSession compatible object or a doc instance
    if (props.documentSession) {
      this.documentSession = props.documentSession;
      this.doc = this.documentSession.getDocument();
    } else if (props.doc) {
      this.documentSession = new DocumentSession(props.doc);
      this.doc = props.doc;
    } else {
      throw new Error('Controller requires a DocumentSession instance');
    }
    this.surfaceManager = new SurfaceManager(this.documentSession);
    this.toolManager = new ToolManager(this);

    var config = this.getConfig();
    this._initializeComponentRegistry(config.controller.components);
    this._initializeCommandRegistry(config.controller.commands);
    if (config.i18n) {
      I18n.instance.load(config.i18n);
    }

    // Register event handlers
    this.doc.on('document:changed', this.onDocumentChanged, this, {
      // Use lower priority so that everyting is up2date
      // when we receive the update
      priority: -20
    });
    // a hook so that the application can add application specific
    // data to every change
    // TODO: evaluate if this is really necessary
    // we have used it once to trigger state changes, e.g. open a panel
    // on undo/redo
    this.doc.on('transaction:started', this.onTransactionStarted, this);
  };

  this._disposeController = function() {
    this.doc.off(this);
    this.surfaceManager.dispose();
    this.toolManager.dispose();
    // Note: we need to clear everything, as the childContext
    // changes which is immutable
    this.empty();
  };

  // Use static config if available, otherwise try to fetch it from props
  this.getConfig = function() {
    if (this.props.config) {
      return this.props.config;
    } else if (this.constructor.static.config) {
      return this.constructor.static.config;
    } else {
      return {
        controller: {
          components: {},
          commands: []
        }
      };
    }
  };

  this._initializeComponentRegistry = function(components) {
    var componentRegistry = new Registry();
    each(components, function(ComponentClass, name) {
      componentRegistry.add(name, ComponentClass);
    });
    this.componentRegistry = componentRegistry;
  };

  this._initializeCommandRegistry = function(commands) {
    var commandRegistry = new Registry();
    each(commands, function(CommandClass) {
      var commandContext = extend({}, this.context, this.getChildContext());
      var cmd = new CommandClass(commandContext);
      commandRegistry.add(CommandClass.static.name, cmd);
    }.bind(this));
    this.commandRegistry = commandRegistry;
  };

  this.willUpdateState = function(newState) {
    this.handleStateUpdate(newState);
  };

  this.handleStateUpdate = function(newState) {
    /* jshint unused: false */
    // no-op, should be overridden by custom writer
  };

  /**
    Get registered controller command by name

    @param {String} commandName the command name
    @return {ui/ControllerCommand} A controller command
  */
  this.getCommand = function(commandName) {
    return this.commandRegistry.get(commandName);
  };

  /**
    Execute command with given name if registered. In most cases this triggers a document transformation and
    corresponding UI updates. For instance when pressing `ctrl+b` the
    `toggleStrong` command is executed. Each implemented command returns a custom
    info object, describing the action that has been performed.
    After execution a `command:executed` event is emitted on the controller.

    @param {String} commandName the command name
    @return {ui/ControllerCommand} A controller command
  */
  this.executeCommand = function(commandName) {
    var cmd = this.getCommand(commandName);
    if (!cmd) {
      warn('command', commandName, 'not registered on controller');
      return;
    }
    // Run command
    var info = cmd.execute();
    if (info) {
      this.emit('command:executed', info, commandName, cmd);
      /* TODO: We want to replace this with a more specific, scoped event
        but for that we need an improved EventEmitter API */
    } else if (info === undefined) {
      warn('command ', commandName, 'must return either an info object or true when handled or false when not handled');
    }
  };

  this.getLogger = function() {
    return this.logger;
  };

  /**
   * Get document instance
   *
   * @return {model/Document} The document instance owned by the controller
   */
  this.getDocument = function() {
    return this.doc;
  };

  this.getDocumentSession = function() {
    return this.documentSession;
  };

  this.getSurface = function(name) {
    return this.surfaceManager.getSurface(name);
  };

  /**
   * Get the currently focused Surface.
   *
   * @return {ui/Surface} Surface instance
   */
  this.getFocusedSurface = function() {
    return this.surfaceManager.getFocusedSurface();
  };

  /**
   * Get selection of currently focused surface. We recomment to use getSelection on Surface
   * instances directly when possible.
   *
   * @return {model/Selection} the current selection derived from the surface.
   */
  this.getSelection = function() {
    warn('DEPRECATED: use documentSession.getSelection() instead.');
    return this.documentSession.getSelection();
  };

  this.getContainerId = function() {
    warn('DEPRECATED: use controller.getFocusedSurface().getContainerId() instead.');
    var surface = this.getSurface();
    if (surface) {
      return surface.getContainerId();
    }
  };

  /**
    Retrieve the names of all available surface commands

    Used by ToolManager, when there is no focused surface
  */
  this.getAllSurfaceCommands = function() {
    var surfaceCommands = {};
    var config = this.getConfig();

    each(config.surfaces, function(surfaceConfig) {
      each(surfaceConfig.commands, function(CommandClass) {
        var name = CommandClass.static.name;
        surfaceCommands[name] = name;
      });
    });
    return Object.keys(surfaceCommands);
  };

  // For now just delegate to the current surface
  // TODO: Remove. Let's only allow Document.transaction and Surface.transaction to
  // avoid confusion
  this.transaction = function() {
    var surface = this.getFocusedSurface();
    if (surface) {
      return surface.getContainerId();
    }
  };

  // return true when you handled a key combo
  this.handleApplicationKeyCombos = function(e) {
    // console.log('####', e.keyCode, e.metaKey, e.ctrlKey, e.shiftKey);
    var handled = false;

    if (e.keyCode === 27) {
      this.setState(this.getInitialState());
      handled = true;
    }
    // Save: cmd+s
    else if (e.keyCode === 83 && (e.metaKey||e.ctrlKey)) {
      this.executeCommand('save');
      handled = true;
    }

    if (handled) {
      e.preventDefault();
      e.stopPropagation();
      return true;
    }
  };

  this.uploadFile = function(file, cb) {
    // This is a testing implementation
    if (this.props.onUploadFile) {
      return this.props.onUploadFile(file, cb);
    } else {
      // Default file upload implementation
      // We just return a temporary objectUrl
      var fileUrl = window.URL.createObjectURL(file);
      cb(null, fileUrl);
    }
  };

  /**
   * Start document save workflow
   */
  this.saveDocument = function() {
    var doc = this.getDocument();
    var logger = this.getLogger();

    if (doc.__dirty && !doc.__isSaving) {
      logger.info('Saving ...');
      doc.__isSaving = true;
      // Pass saving logic to the user defined callback if available
      if (this.props.onSave) {
        // TODO: calculate changes since last save
        var changes = [];
        this.props.onSave(doc, changes, function(err) {
          doc.__isSaving = false;
          if (err) {
            logger.error(err.message || err.toString());
          } else {
            doc.__dirty = false;
            this.emit('document:saved');
            logger.info('No changes');
          }
        }.bind(this));
      } else {
        logger.error('Document saving is not handled at the moment. Make sure onSave is passed in the props');
      }
    }
  };

  /* Event handlers
     ============== */

  this.onTransactionStarted = function(tx) {
    /* jshint unused: false */
  };

  this.onDocumentChanged = function(change, info) {
    // On undo/redo
    if (info.replay) {
      // after undo/redo, also recover the stored controller state
      if (change.after.state) {
        this.setState(change.after.state);
      }
    }
    // Save logic related
    // TODO: we need to rethink this regarding real-time collab
    var doc = this.getDocument();
    doc.__dirty = true;
    var logger = this.getLogger();
    logger.info('Unsaved changes');
  };

  this.onCommandExecuted = function(info, commandName, cmd) {
    /* jshint unused: false */
  };

};


/**
  Emitted after a command has been executed. Since we did not allow command
  implementations to access UI components, UI components can listen to
  the `command:executed` event and perform necessary action then.

  @event ui/Controller@command:executed

  @param {object} info information about the command execution
  @param {String} commandName the command name (e.g. 'strong', 'emphasis')
  @param {ui/Command} cmd the command instance
  @example

  ```js
  LinkTool.Prototype = function() {
    this.didInitialize = function() {
      var ctrl = this.getController();

      ctrl.on('command:executed', this.onCommandExecuted, this);
    };

    this.onCommandExecuted = function(info, commandName) {
      if (commandName === this.getCommandName()) {
        // Toggle the edit prompt when either edit is
        // requested or a new link has been created
        if (_.includes(['edit','create'], info.mode)) {
          this.togglePrompt();
        }
      }
    };
    ...
  };
  ```
*/

/**
  Emitted when a save workflow has been completed successfully.

  @event ui/Controller@document:saved
*/

Component.extend(Controller);

function _concatArrays(objValue, srcValue) {
  if (isArray(objValue)) {
    return objValue.concat(srcValue);
  }
}

Controller.static.mergeConfig = function(one, other) {
  var config = {
    controller: {
      components: {},
      commands: []
    }
  };
  mergeWith(config, one, _concatArrays);
  mergeWith(config, other, _concatArrays);
  return config;
};

module.exports = Controller;
