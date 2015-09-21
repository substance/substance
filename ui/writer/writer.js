"use strict";

var OO = require('../../basics/oo');
var Component = require('../component');
var _ = require("../../basics/helpers");
var EventEmitter = require('../../basics/event_emitter');
var Controller = require('../../ui/controller');

var $$ = Component.$$;

function Writer() {
  Component.apply(this, arguments);

  // Mixin EventEmitter API
  EventEmitter.call(this);

  this.config = this.props.config || {};
  this.handleApplicationKeyCombos = this.handleApplicationKeyCombos.bind(this);

  var doc = this.props.doc;

  // Initialize controller
  this.controller = new Controller(doc, {
    components: this.config.components,
    commands: this.config.commands
  });

  // Register event handlers
  // -----------------

  doc.connect(this, {
    'transaction:started': this.onTransactionStarted,
    'document:changed': this.onDocumentChanged
  });

  this.controller.connect(this, {
    "selection:changed": this.onSelectionChanged
  });

  // action handlers
  this.actions({
    "switchState": this.switchState,
    "switchContext": this.switchContext,
    "requestSave": this.requestSave
  });
}

Writer.Prototype = function() {

  // Mixin EventEmitter API
  _.extend(this, EventEmitter.prototype);

  this.getChildContext = function() {
    return {
      controller: this.controller,
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
    var clipboard = this.controller.getClipboard();
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
  this.onTransactionStarted = function(tx) {
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
    var ComponentClass = this.controller.getComponent(this.state.contextId);

    if (ComponentClass) {
      return $$(ComponentClass).setProps(this._panelPropsFromState(this.state));
    } else {
      console.warn("Could not find component for contextId:", this.state.contextId);
    }
  };

  this._disposeDoc = function() {
    this.props.doc.disconnect(this);
    var clipboard = this.controller.getClipboard();
    clipboard.detach(this.$el[0]);
    this.controller.dispose();
  };

};

OO.inherit(Writer, Component);

module.exports = Writer;
