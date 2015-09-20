"use strict";

var OO = require('../../basics/oo');
var Component = require('../component');
var _ = require("../../basics/helpers");
var EventEmitter = require('../../basics/event_emitter');
var Registry = require('../../basics/registry');
var SurfaceManager = require('../../surface/surface_manager');
var Clipboard = require('../../surface/clipboard');

var $$ = Component.$$;

// TODO: re-establish a means to set which tools are enabled for which surface

function Writer() {
  Component.apply(this, arguments);
  // Mixin
  EventEmitter.call(this);

  this.config = this.props.config || {};
  this.handleApplicationKeyCombos = this.handleApplicationKeyCombos.bind(this);
  this._initializeComponentRegistry();

  // action handlers
  this.actions({
    "switchState": this.switchState,
    "switchContext": this.switchContext,
    "requestSave": this.requestSave
  });
}

Writer.Prototype = function() {

  // mix-in
  _.extend(this, EventEmitter.prototype);

  this.getChildContext = function() {
    return {
      getHighlightedNodes: this.getHighlightedNodes,
      getHighlightsForTextProperty: this.getHighlightsForTextProperty,
      componentRegistry: this.componentRegistry,
      toolRegistry: this.toolRegistry,
      surfaceManager: this.surfaceManager,
      document: this.props.doc,
      commands: this.config.commands
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
    // Initialize doc stuff
    // if (this.props.doc) {
    var doc = this.props.doc;
    this.surfaceManager = new SurfaceManager(doc);
    this.clipboard = new Clipboard(this.surfaceManager, doc.getClipboardImporter(), doc.getClipboardExporter());

    doc.connect(this, {
      'transaction:started': this.transactionStarted,
      'document:changed': this.onDocumentChanged
    });

    this.surfaceManager.connect(this, {
      "selection:changed": this.onSelectionChanged
    });

    // Now handle state update for the initial state
    this.handleStateUpdate(state);
  };

  this.getSurface = function() {
    return this.surfaceManager.getFocusedSurface();
  };

  this.willUpdateState = function(newState) {
    this.handleStateUpdate(newState);
  };

  this.handleStateUpdate = function() {
    // no-op, should be overridden by custom writer
  };

  this.didMount = function() {
    this.$el.on('keydown', this.handleApplicationKeyCombos);

    // Handle the initial state
    // We do this after mount which actually triggers some rerenders
    // A better place would be to do this 
    // this.handleStateUpdate(newState);
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
      this.saveDocument();
      handled = true;
    }

    if (handled) {
      e.preventDefault();
      e.stopPropagation();
      return true;
    }
  };

  // FIXME: even if this seems to be very hacky,
  // it is quite useful to make transactions 'app-compatible'
  this.transactionStarted = function(tx) {
    /* jshint unused: false */
    // // store the state so that it can be recovered when undo/redo
    // tx.before.state = this.state;
    // tx.before.selection = this.getSelection();
  };

  this.onDocumentChanged = function(change, info) {
    var doc = this.getDocument();
    doc.__dirty = true;
    var notifications = this.context.notifications;
    notifications.addMessage({
      type: "info",
      message: "Unsaved changes"
    });
    // after undo/redo, also recover the stored writer state
    if (info.replay && change.after.state) {
      this.setState(change.after.state);
    }
  };

  this.saveDocument = function() {
    var doc = this.props.doc;
    var backend = this.context.backend;
    var notifications = this.context.notifications;
    if (doc.__dirty && !doc.__isSaving) {
      notifications.addMessage({
        type: "info",
        message: "Saving ..."
      });
      doc.__isSaving = true;
      backend.saveDocument(doc, function(err) {
        doc.__isSaving = false;
        if (err) {
          notifications.addMessage({
            type: "error",
            message: err.message || err.toString()
          });
        } else {
          doc.emit('document:saved');
          notifications.addMessage({
            type: "info",
            message: "No changes"
          });
          doc.__dirty = false;
        }
      });
    }
  };

  // Action handlers
  // ---------------

  // handles 'switch-state'
  this.switchState = function(newState) {
    this.setState(newState);
  };

  // handles 'switch-context'
  this.switchContext = function(contextId) {
    this.setState({ contextId: contextId });
  };

  this.requestSave = function() {
    this.saveDocument();
  };

  // Pass writer start 
  this._panelPropsFromState = function (state) {
    var props = _.omit(state, 'contextId');
    props.doc = this.props.doc;
    return props;
  };

  this.getActivePanelElement = function() {
    if (this.componentRegistry.contains(this.state.contextId)) {
      var panelComponent = this.componentRegistry.get(this.state.contextId);
      return $$(panelComponent).setProps(this._panelPropsFromState(this.state));
    } else {
      console.warn("Could not find component for contextId:", this.state.contextId);
    }
  };

  this._initializeComponentRegistry = function() {
    var componentRegistry = new Registry();
    _.each(this.config.components, function(ComponentClass, name) {
      componentRegistry.add(name, ComponentClass);
    });
    this.componentRegistry = componentRegistry;
  };

  this._disposeDoc = function() {
    this.props.doc.disconnect(this);
    this.surfaceManager.dispose();
    this.clipboard.detach(this.$el[0]);
    this.surfaceManager.dispose();
    this.surfaceManager = null;
    this.clipboard = null;
  };

};

OO.inherit(Writer, Component);

module.exports = Writer;
