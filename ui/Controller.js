'use strict';

var oo = require('../util/oo');
var _ = require('../util/helpers');
var Component = require('./Component');
var Clipboard = require('./Clipboard');
var ToolManager = require('./ToolManager');
var Registry = require('../util/Registry');
var Logger = require ('../util/Logger');
var Selection = require('../model/Selection');

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

  @fires ui/Controller#command:executed
  @fires ui/Controller#selection:changed
  @fires ui/Controller#document:saved
*/
function Controller() {
  Component.apply(this, arguments);
  if (!this.props.doc) throw new Error('Controller requires a Substance document instance');
  this.surfaces = {};
  this.focusedSurface = null;
  this.stack = [];
  this.logger = new Logger();
  var config = this.getConfig();
  this._initializeComponentRegistry(config.controller.components);
  this._initializeCommandRegistry(config.controller.commands);
  this.clipboard = new Clipboard(this, this.props.doc.getClipboardImporter(), this.props.doc.getClipboardExporter());
  this.toolManager = new ToolManager(this);
  this._initialize(this.props);
  this.handleStateUpdate(this.state);
}

Controller.Prototype = function() {

  this.didMount = function() {
    this.$el.on('keydown', this.handleApplicationKeyCombos);
    // Attach clipboard
    this.clipboard.attach(this.$el[0]);
  };

  /**
   * Dispose component when component life ends. If you need to implement dispose
   * in your custom Controller class, don't forget the super call.
   */
  this.dispose = function() {
    this.$el.off('keydown');
    if (this.props.doc) {
      this._dispose();
    }
  };

  this._dispose = function() {
    this.props.doc.disconnect(this);
    this.clipboard.detach(this.$el[0]);
  };

  this.willReceiveProps = function(newProps) {
    if (this.props.doc && newProps.doc !== this.props.doc) {
      this._dispose();
      this.empty();
      this._initialize(newProps);
    }
  };

  this._initialize = function(props) {
    var doc = props.doc;

    // Register event handlers
    doc.connect(this, {
      'document:changed': this.onDocumentChanged,
      'transaction:started': this.onTransactionStarted
    }, {
      // Use lower priority so that everyting is up2date
      // when we receive the update
      priority: -20
    });
  };

  // Use static config if available, otherwise try to fetch it from props
  this.getConfig = function() {
    return this.constructor.static.config || this.props.config;
  };

  /**
   * Defines the child context
   *
   * @return {object} the child context
   */
  this.getChildContext = function() {
    return {
      config: this.getConfig(),
      doc: this.props.doc,
      controller: this,
      componentRegistry: this.componentRegistry,
      toolManager: this.toolManager,
      i18n: I18n.instance
    };
  };

  /**
    Get the associated ToolManager instance

    @return {ui/ToolManager} the ToolManager instance
  */
  this.getToolManager = function() {
    return this.toolManager;
  };

  this._initializeComponentRegistry = function(components) {
    var componentRegistry = new Registry();
    _.each(components, function(ComponentClass, name) {
      componentRegistry.add(name, ComponentClass);
    });
    this.componentRegistry = componentRegistry;
  };

  this._initializeCommandRegistry = function(commands) {
    var commandRegistry = new Registry();
    _.each(commands, function(CommandClass) {
      var cmd = new CommandClass(this);
      commandRegistry.add(CommandClass.static.name, cmd);
    }, this);
    this.commandRegistry = commandRegistry;
  };

  /**
    Get registered controller command by name

    @param commandName {String} the command name
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

    @param commandName {String} the command name
    @return {ui/ControllerCommand} A controller command
  */
  this.executeCommand = function(commandName) {
    var cmd = this.getCommand(commandName);
    if (!cmd) {
      console.warn('command', commandName, 'not registered on controller');
      return;
    }
    // Run command
    var info = cmd.execute();
    if (info) {
      this.emit('command:executed', info, commandName, cmd);
      /* TODO: We want to replace this with a more specific, scoped event
        but for that we need an improved EventEmitter API */
    } else if (info === undefined) {
      console.warn('command ', commandName, 'must return either an info object or true when handled or false when not handled');
    }
  };

  this.getLogger = function() {
    return this.logger;
  };

  this.getClipboard = function() {
    return this.clipboard;
  };

  /**
   * Get document instance
   *
   * @return {model/Document} The document instance owned by the controller
   */
  this.getDocument = function() {
    return this.props.doc;
  };

  /**
   * Get Surface instance
   *
   * @param name {String} Name under which the surface is registered
   * @return {ui/Surface} The surface instance
   */

  this.getSurface = function(name) {
    if (name) {
      return this.surfaces[name];
    } else {
      console.warn('Deprecated: Use getFocusedSurface. Always provide a name for getSurface otherwise.');
      return this.getFocusedSurface();
    }
  };

  /**
   * Get the currently focused Surface
   *
   * @return {ui/Surface} The surface instance
   */
  this.getFocusedSurface = function() {
    return this.focusedSurface;
  };

  /**
   * Get selection of currently focused surface. We recomment to use getSelection on Surface
   * instances directly when possible.
   *
   * @return {model/Selection} the current selection derived from the surface.
   */
  this.getSelection = function() {
    var surface = this.getSurface();
    if (surface) {
      return surface.getSelection();
    } else {
      return Selection.nullSelection;
    }
  };

  /**
   * Get containerId for currently focused surface
   *
   * @return {String|undefined} container id for currently focused surface, or undefined
   */
  this.getContainerId = function() {
    var surface = this.getSurface();
    if (surface) {
      return surface.getContainerId();
    }
  };

  /**
   * Register a surface
   *
   * @param surface {ui/Surface} A new surface instance to register
   */
  this.registerSurface = function(surface) {
    surface.connect(this, {
      'selection:changed': this._onSelectionChanged,
      'command:executed': this._onCommandExecuted
    });
    this.surfaces[surface.getName()] = surface;
  };

  /**
   * Unregister a surface
   *
   * @param surface {ui/Surface} A surface instance to unregister
   */
  this.unregisterSurface = function(surface) {
    surface.disconnect(this);
    delete this.surfaces[surface.getName()];
    if (surface && this.focusedSurface === surface) {
      this.focusedSurface = null;
    }
  };

  /**
   * Check if there are any surfaces registered
   *
   * @return {true|false} true if surface count > 0
   */
  this.hasSurfaces = function() {
    return Object.keys(this.surfaces).length > 0;
  };

  /**
   * Called whenever a surface has been focused.
   *
   * @TODO Should this really be a public method?
   */
  this.didFocus = function(surface) {
    if (this.focusedSurface && surface !== this.focusedSurface) {
      this.focusedSurface.setFocused(false);
    }
    this.focusedSurface = surface;
  };

  // For now just delegate to the current surface
  // TODO: Remove. Let's only allow Document.transaction and Surface.transaction to
  // avoid confusion
  this.transaction = function() {
    var surface = this.getFocusedSurface();
    if (!surface) {
      throw new Error('No focused surface!');
    }
    surface.transaction.apply(surface, arguments);
  };

  // FIXME: even if this seems to be very hacky,
  // it is quite useful to make transactions 'app-compatible'
  this.onTransactionStarted = function(tx) {
    /* jshint unused: false */
    // // store the state so that it can be recovered when undo/redo
    // tx.before.state = this.state;
    // tx.before.selection = this.getSelection();
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

  this.handleStateUpdate = function() {
    // no-op, should be overridden by custom writer
  };

  this.willUpdateState = function(newState) {
    this.handleStateUpdate(newState);
  };

  this.onDocumentChanged = function(change, info) {
    // On undo/redo
    if (info.replay) {
      var selection = change.after.selection;
      var surfaceId = change.after.surfaceId;
      if (surfaceId) {
        var surface = this.surfaces[surfaceId];
        if (surface) {
          if (this.focusedSurface !== surface) {
            this.didFocus(surface);
          }
          surface.setSelection(selection);
        } else {
          console.warn('No surface with name', surfaceId);
        }
      }

      // after undo/redo, also recover the stored controller state
      if (change.after.state) {
        this.setState(change.after.state);
      }
    }

    // Save logic related
    var doc = this.getDocument();
    doc.__dirty = true;
    var logger = this.getLogger();
    logger.info('Unsaved changes');
  };

  this.onSelectionChanged = function(sel, surface) {
    /* jshint unused: false */
    // No-op: Please override in custom controller class
  };

  this.onCommandExecuted = function(info, commandName, cmd) {
    /* jshint unused: false */
    // No-op: Please override in custom controller class
  };

  this._onSelectionChanged = function(sel, surface) {
    this.emit('selection:changed', sel, surface);
    this.onSelectionChanged(sel, surface);
  };

  this._onCommandExecuted = function(info, commandName, cmd) {
    this.emit('command:executed', info, commandName, cmd);
    this.onCommandExecuted(info, commandName, cmd);
  };

  /**
   * Push surface state
   */
  this.pushState = function() {
    var state = {
      surface: this.focusedSurface,
      selection: null
    };
    if (this.focusedSurface) {
      state.selection = this.focusedSurface.getSelection();
    }
    this.focusedSurface = null;
    this.stack.push(state);
  };

  /**
   * Pop surface state
   */
  this.popState = function() {
    var state = this.stack.pop();
    if (state && state.surface) {
      state.surface.setFocused(true);
      state.surface.setSelection(state.selection);
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

  /**
   * Render method of the controller component. This needs to be implemented by the
   * custom Controller class.
   *
   * @abstract
   * @return {ui.Component.VirtualNode} VirtualNode created using Component.$$
   */
  this.render = function() {
    throw new Error('Controller.prototype.render is abstract. You need to define your own controller component');
  };
};

/**
  Emitted after a command has been executed. Since we did not allow command
  implementations to access UI components, UI components can listen to
  the `command:executed` event and perform necessary action then.

  @event ui/Controller#command:executed

  @param info {object} information about the command execution
  @param commandName {String} the command name (e.g. 'strong', 'emphasis')
  @param cmd {ui/Command} the command instance
  @example

  LinkTool.Prototype = function() {
    this.didInitialize = function() {
      var ctrl = this.getController();

      ctrl.connect(this, {
        'command:executed': this.onCommandExecuted
      });
    };

    this.onCommandExecuted = function(info, commandName) {
      if (commandName === this.static.command) {
        // Toggle the edit prompt when either edit is
        // requested or a new link has been created
        if (_.includes(['edit','create'], info.mode)) {
          this.togglePrompt();
        }
      }
    };
    ...
  };
*/

/**
  Emitted when the active selection has changed, e.g. through cursor movement.
  Transports `sel` a DocumentSelection that can be expected but also the
  surface in which the selection change happened.

  @event ui/Controller#selection:changed
  @param cmd {ui/Command} the command instance
*/

/**
  Emitted when a save workflow has been completed successfully.

  @event ui/Controller#document:saved
*/

oo.inherit(Controller, Component);
module.exports = Controller;
