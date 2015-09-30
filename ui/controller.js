'use strict';

var OO = require('../basics/oo');
var Surface = require('./surface/surface');
var EventEmitter = require('../basics/event_emitter');
var _ = require('../basics/helpers');
var Clipboard = require('./surface/clipboard');
var Registry = require('../basics/registry');
var Logger = require ('../basics/logger');

var defaultCommands = require('./commands');

var Controller = function(doc, config) {
  EventEmitter.call(this);

  if (!doc) throw new Error('Controller requires a Substance document instance');

  this.doc = doc;
  this.config = config;
  this.surfaces = {};
  this.focusedSurface = null;
  this.stack = [];

  this.logger = new Logger();

  // Initialize registries
  this._initializeComponentRegistry();
  this._initializeCommandRegistry();

  // Initialize clipboard
  this.clipboard = new Clipboard(this, doc.getClipboardImporter(), doc.getClipboardExporter());

  doc.connect(this, {
    'document:changed': this.onDocumentChanged,
    'transaction:started': this.onTransactionStarted
  }, {
    // Use lower priority so that everyting is up2date
    // when we render the selection
    priority: -10
  });
};

Controller.Prototype = function() {

  this._initializeComponentRegistry = function() {
    var componentRegistry = new Registry();
    _.each(this.config.components, function(ComponentClass, name) {
      componentRegistry.add(name, ComponentClass);
    });
    this.componentRegistry = componentRegistry;
  };

  this._initializeCommandRegistry = function() {
    var commands = this.config.commands || defaultCommands;

    var commandRegistry = new Registry();
    _.each(commands, function(CommandClass) {
      var cmd = new CommandClass(this);
      commandRegistry.add(CommandClass.static.name, cmd);
    }, this);
    this.commandRegistry = commandRegistry;
  };

  // Command API
  // ----------------

  this.getCommand = function(commandName) {
    return this.commandRegistry.get(commandName);
  };

  this.executeCommand = function(commandName) {
    var cmd = this.getCommand(commandName);
    if (!cmd) {
      console.warn('command', commandName, 'not registered on controller');
      return;
    }

    // Run command
    var info = cmd.execute();
    if (info) {
      this.emit('command:executed', info, commandName);
      // TODO: We want to replace this with a more specific, scoped event
      // but for that we need an improved EventEmitter API
      // this.emit('command:executed', 'commandName', info, commandName);
    } else if (info === undefined) {
      console.warn('command ', commandName, 'must return either an info object or true when handled or false when not handled');
    }
  };

  this.getLogger = function() {
    return this.logger;
  };

  // Component API
  // ----------------

  this.getComponent = function(name) {
    return this.componentRegistry.get(name);
  };

  this.getClipboard = function() {
    return this.clipboard;
  };

  this.getDocument = function() {
    return this.doc;
  };

  // If no name is provided, the focused surface is returned
  this.getSurface = function(name) {
    if (name) {
      return this.surfaces[name];
    } else {
      return this.focusedSurface;  
    }
  };

  // Get selection of currently focused surface
  this.getSelection = function() {
    var surface = this.getSurface();
    return surface.getSelection();
  };

  // Get containerId for currently focused surface
  // Returns undefined for non-container-editors
  this.getContainerId = function() {
    var surface = this.getSurface();
    return surface.getContainerId();
  };

  this.createSurface = function(editor, options) {
    return new Surface(this, editor, options);
  };

  this.registerSurface = function(surface) {
    surface.connect(this, {
      'selection:changed': this.onSelectionChanged
    });
    this.surfaces[surface.getName()] = surface;
  };

  this.unregisterSurface = function(surface) {
    surface.disconnect(this);
    delete this.surfaces[surface.getName()];
    if (surface && this.focusedSurface === surface) {
      this.focusedSurface = null;
    }
  };

  this.hasSurfaces = function() {
    return Object.keys(this.surfaces).length > 0;
  };

  this.didFocus = function(surface) {
    if (this.focusedSurface && surface !== this.focusedSurface) {
      this.focusedSurface.setFocused(false);
    }
    this.focusedSurface = surface;
  };

  this.getFocusedSurface = function() {
    console.warn('.getFocusedSurface is deprecated: Use .getSurface instead');
    return this.getSurface();
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
    // ----------

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

    // Save logic
    // ----------

    var doc = this.getDocument();
    doc.__dirty = true;
    var logger = this.getLogger();
    logger.info('Unsaved changes');
  };

  this.onSelectionChanged = function(sel, surface) {
    // Skip if the selection has not really changed
    // if (sel.equals(this.__prevSelection)) {
    //   return;
    // }
    // this.__prevSelection = sel;
    this.emit('selection:changed', sel, surface);
  };

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

  this.popState = function() {
    var state = this.stack.pop();
    if (state && state.surface) {
      state.surface.setFocused(true);
      state.surface.setSelection(state.selection);
    }
  };
  
  this.saveDocument = function() {
    var doc = this.getDocument();
    var logger = this.getLogger();

    if (doc.__dirty && !doc.__isSaving) {
      logger.info('Saving ...');
      doc.__isSaving = true;
      // Pass saving logic to the user defined callback if available
      if (this.config.onDocumentSave) {
        // TODO: calculate changes since last save
        var changes = [];
        this.config.onDocumentSave(doc, changes, function(err) {
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

  this.dispose = function() {
    this.doc.disconnect(this);
    this.surfaces = {};
    this.clipboard = null;
  };
};

OO.inherit(Controller, EventEmitter);

module.exports = Controller;
