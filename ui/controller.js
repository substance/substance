'use strict';

var OO = require('../basics/oo');
var _ = require('../basics/helpers');
var Component = require('./component');
var Clipboard = require('./surface/clipboard');
var ToolManager = require('./tool_manager');
var Registry = require('../basics/registry');
var Logger = require ('../basics/logger');
var Selection = require('../document/selection');

// Setup default I18n
var I18n = require('./i18n');
I18n.instance.load(require('./i18n/en'));

/**
 * Controls Substance infrastructure. Needs to be supplied as a top level instance
 * to serve editors, commands and tools as a context.
 * 
 * @class
 * @memberof module:ui
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
  this.props.doc.connect(this, {
    'document:changed': this.onDocumentChanged,
    'transaction:started': this.onTransactionStarted
  }, {
    // Use lower priority so that everyting is up2date
    // when we render the selection
    priority: -10
  });
}

Controller.Prototype = function() {

  // Use static config if available, otherwise try to fetch it from props
  this.getConfig = function() {
    return this.constructor.static.config || this.props.config;
  };

  /**
   * Defines the child context
   * 
   * @return {object} the child context
   * @method getChildContext
   * @memberof module:ui.Controller.prototype
   */
  this.getChildContext = function() {
    return {
      config: this.getConfig(),
      controller: this,
      componentRegistry: this.componentRegistry,
      toolManager: this.toolManager,
      i18n: I18n.instance
    };
  };

  /**
   * Get the associated ToolManager instance
   * 
   * @return {module:ui.ToolManager} the ToolManager instance
   * @method getToolManager
   * @memberof module:ui.Controller.prototype
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
   * Get registered controller command by name
   * 
   * @param commandName {String} the command name
   * @return {module:ui.commands.ControllerCommand} A controller command
   * @method getCommand
   * @memberof module:ui.Controller.prototype
   */
  this.getCommand = function(commandName) {
    return this.commandRegistry.get(commandName);
  };

  /**
   * Execute command with given name if registered
   * 
   * @param commandName {String} the command name
   * @return {module:ui.commands.ControllerCommand} A controller command
   * @method getCommand
   * @memberof module:ui.Controller.prototype
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
      // TODO: We want to replace this with a more specific, scoped event
      // but for that we need an improved EventEmitter API
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
   * @return {module:document.Document} The document instance owned by the controller
   * @method getDocument
   * @memberof module:ui.Controller.prototype
   */
  this.getDocument = function() {
    return this.props.doc;
  };

  /**
   * Get Surface instance
   *
   * @method getSurface
   * @param name {String} Name under which the surface is registered
   * @return {module:ui.surface.Surface} The surface instance
   * @memberof module:ui.Controller.prototype
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
   * @method getFocusedSurface
   * @return {module:ui.surface.Surface} The surface instance
   * @memberof module:ui.Controller.prototype
   */
  this.getFocusedSurface = function() {
    return this.focusedSurface;
  };

  /**
   * Get selection of currently focused surface. We recomment to use getSelection on Surface
   * instances directly when possible.
   *
   * @method getSelection
   * @return {module:document.Document.Selection} the current Document.Selection derived from the surface.
   * @memberof module:ui.Controller.prototype
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
   * @method getContainerId
   * @return {String|undefined} container id for currently focused surface, or undefined
   * @memberof module:ui.Controller.prototype
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
   * @method registerSurface
   * @param surface {Surface} A new surface instance to register
   * @memberof module:ui.Controller.prototype
   */
  this.registerSurface = function(surface) {
    surface.connect(this, {
      'selection:changed': this._onSelectionChanged
    });
    this.surfaces[surface.getName()] = surface;
  };

  /**
   * Unregister a surface
   *
   * @method unregisterSurface
   * @param surface {Surface} A surface instance to unregister
   * @memberof module:ui.Controller.prototype
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
   * @method hasSurface
   * @return {true|false} true if surface count > 0
   * @memberof module:ui.Controller.prototype
   */
  this.hasSurfaces = function() {
    return Object.keys(this.surfaces).length > 0;
  };

  /**
   * Called whenever a surface has been focused. 
   * 
   * TOOD: Should this really be a public method?
   *
   * @method didFocus
   * @memberof module:ui.Controller.prototype
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
    var surface = this.getSurface();
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
    }

    // Save logic related
    var doc = this.getDocument();
    doc.__dirty = true;
    var logger = this.getLogger();
    logger.info('Unsaved changes');
  };

  this._onSelectionChanged = function(sel, surface) {
    this.emit('selection:changed', sel, surface);
  };

  /**
   * Push surface state
   * 
   * @method pushState
   * @memberof module:ui.Controller.prototype
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
   * 
   * @method popState
   * @memberof module:ui.Controller.prototype
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
   * 
   * @method saveDocument
   * @memberof module:ui.Controller.prototype
   */
  this.saveDocument = function() {
    var doc = this.getDocument();
    var logger = this.getLogger();

    if (doc.__dirty && !doc.__isSaving) {
      logger.info('Saving ...');
      doc.__isSaving = true;
      // Pass saving logic to the user defined callback if available
      if (this.props.config.onSave) {
        // TODO: calculate changes since last save
        var changes = [];
        this.props.config.onSave(doc, changes, function(err) {
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
        logger.error('Document saving is not handled at the moment. Make sure onDocumentSave is passed in the config object');
      }
    }
  };

  /**
   * Render method of the controller component. This needs to be implemented by the
   * custom Controller class.
   * 
   * @return {VirtualNode} VirtualNode created using Component.$$
   * @method render
   * @abstract
   * @memberof module:ui.Controller.prototype
   */
  this.render = function() {
    throw new Error('Controller.prototype.render is abstract. You need to define your own controller component');
  };

  /**
   * Dispose component when component life ends. If you need to implement dispose
   * in your custom Controller class, don't forget the super call.
   * 
   * @method dispose
   * @memberof module:ui.Controller.prototype
   */
  this.dispose = function() {
    this.doc.disconnect(this);
    this.surfaces = {};
    this.clipboard = null;
  };
};

OO.inherit(Controller, Component);
module.exports = Controller;
