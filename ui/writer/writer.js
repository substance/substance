"use strict";

var OO = require('../../basics/oo');
var Component = require('../component');
var _ = require("../../basics/helpers");
var EventEmitter = require('../../basics/event_emitter');
var Surface = require('../../ui/surface');
var ContainerEditor = require('../../ui/surface/container_editor');
var Registry = require('../../basics/registry');

var $$ = Component.$$;

function Writer() {
  Component.apply(this, arguments);

  // Mixin EventEmitter API
  EventEmitter.call(this);

  this.config = this.props.config || {};
  this.handleApplicationKeyCombos = this.handleApplicationKeyCombos.bind(this);
  this._initializeComponentRegistry(this.config.components);
  var doc = this.props.doc;  
  var editor = new ContainerEditor(this.config.containerId);

  // The main editor
  this.surface = new Surface(doc, editor, {
    components: this.config.components,
    commands: this.config.commands,
    name: 'mainEditor'
  });

  // Register event handlers
  // -----------------

  doc.connect(this, {
    'document:changed': this.onDocumentChanged
  });

  this.surface.connect(this, {
    "selection:changed": this.onSelectionChanged
  });

  // action handlers
  this.actions({
    "switchState": this.switchState,
    "switchContext": this.switchContext
  });
}

Writer.Prototype = function() {

  this._initializeComponentRegistry = function(components) {
    var componentRegistry = new Registry();
    _.each(components, function(ComponentClass, name) {
      componentRegistry.add(name, ComponentClass);
    });
    this.componentRegistry = componentRegistry;
  };

  // Mixin EventEmitter API
  _.extend(this, EventEmitter.prototype);

  this.getChildContext = function() {
    return {
      surface: this.surface,
      componentRegistry: this.componentRegistry
    };
  };

  this.getDocument = function() {
    return this.props.doc;
  };


  this.willReceiveProps = function(newProps) {
    if (this.props.doc && newProps.doc !== this.props.doc) {
      this._disposeDoc();
    }
  };

  this.onSelectionChanged = function(/*sel, surface*/) {
    // no-op, should be overridden by custom writer
  };

  this.didInitialize = function(props, state) {
    /* jshint unused: false */
    // Now handle state update for the initial state
    this.handleStateUpdate(state);
  };

  // If no name is provided focused surface is returned
  this.getSurface = function(name) {
    return this.controller.getSurface(name);
  };

  this.willUpdateState = function(newState) {
    this.handleStateUpdate(newState);
  };

  this.handleStateUpdate = function() {
    // no-op, should be overridden by custom writer
  };

  this.didMount = function() {
    this.$el.on('keydown', this.handleApplicationKeyCombos);
    // Attach clipboard
    var clipboard = this.surface.getClipboard();
    clipboard.attach(this.$el[0]);
  };

  this.willUnmount = function() {
    this.$el.off('keydown');
    if (this.props.doc) {
      this._disposeDoc();
    }
  };

  this.getDocument = function() {
    return this.props.doc;
  };

  // Delegate to controller
  this.executeCommand = function(commandName) {
    return this.controller.executeCommand(commandName);
  };

  // Event handlers
  // --------------

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

  this.onDocumentChanged = function(change, info) {
    // after undo/redo, also recover the stored writer state
    if (info.replay && change.after.state) {
      this.setState(change.after.state);
    }
  };

  // Action handlers
  // ---------------

  // handles 'switch-state'
  this.switchState = function(newState, options) {
    this.setState(newState);
    if (options.restoreSelection) {
      this.restoreSelection();  
    }
  };

  // handles 'switch-context'
  this.switchContext = function(contextId, options) {
    this.setState({ contextId: contextId });
    if (options.restoreSelection) {
      this.restoreSelection();  
    }
  };

  this.restoreSelection = function() {
    var surface = this.controller.getSurface('body');
    surface.rerenderDomSelection();
  };

  // Pass writer start 
  this._panelPropsFromState = function (state) {
    var props = _.omit(state, 'contextId');
    props.doc = this.props.doc;
    return props;
  };

  this.getActivePanelElement = function() {
    var ComponentClass = this.componentRegistry.get(this.state.contextId);
    if (ComponentClass) {
      return $$(ComponentClass).setProps(this._panelPropsFromState(this.state));
    } else {
      console.warn("Could not find component for contextId:", this.state.contextId);
    }
  };

  this._disposeDoc = function() {
    this.props.doc.disconnect(this);
    // this.controller.dispose();
  };

};

OO.inherit(Writer, Component);

module.exports = Writer;
