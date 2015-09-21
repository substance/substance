'use strict';

var OO = require('../basics/oo');
var Surface = require('./surface/surface');
var EventEmitter = require('../basics/event_emitter');
var _ = require('../basics/helpers');
var Clipboard = require('./surface/clipboard');
var Registry = require('../basics/registry');

var defaultCommands = require('./commands');

var Controller = function(doc, config) {
  EventEmitter.call(this);

  if (!doc) throw new Error('Controller requires a Substance document instance');

  this.doc = doc;
  this.config = config;
  this.surfaces = {};
  this.focusedSurface = null;
  this.stack = [];

  // Initialize registries
  this._initializeComponentRegistry();
  this._initializeCommandRegistry();

  // Initialize clipboard
  this.clipboard = new Clipboard(this, doc.getClipboardImporter(), doc.getClipboardExporter());

  doc.connect(this, { 'document:changed': this.onDocumentChange }, {
    // Use lower priority so that everyting is up2date
    // when we render the selection
    priority: -1
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
    cmd.execute();
  };

  // Component API
  // ----------------

  this.getComponent = function(name) {
    return this.componentRegistry.get(name);
  };

  this.getClipboard = function() {
    return this.clipboard;
  };

  // console is the default logger
  this.getLogger = function() {
    return console;
  };

  this.getDocument = function() {
    return this.doc;
  };

  this.getSurface = function(name) {
    if (name) {
      return this.surfaces[name];
    } else {
      return this.focusedSurface;  
    }
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

  this.onDocumentChange = function(change, info) {
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
  };

  this.onSelectionChanged = function(sel, surface) {
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

  this.dispose = function() {
    this.doc.disconnect(this);
    this.surfaces = {};
    this.clipboard = null;
  };
};

OO.inherit(Controller, EventEmitter);

module.exports = Controller;
