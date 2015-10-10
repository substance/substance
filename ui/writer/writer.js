'use strict';

var OO = require('../../basics/oo');
var Component = require('../component');
var _ = require("../../basics/helpers");
var Controller = require('../../ui/controller');

var $$ = Component.$$;

function Writer() {
  Controller.apply(this, arguments);

  this.handleApplicationKeyCombos = this.handleApplicationKeyCombos.bind(this);

  // action handlers
  this.actions({
    "switchState": this.switchState,
    "switchContext": this.switchContext
  });

  /* jshint unused: false */
  this._initialize(this.props);
  // Now handle state update for the initial state
  this.handleStateUpdate(this.state);
}

Writer.Prototype = function() {

  this.didMount = function() {
    this.$el.on('keydown', this.handleApplicationKeyCombos);
    // Attach clipboard
    var clipboard = this.getClipboard();
    clipboard.attach(this.$el[0]);
  };

  this.dispose = function() {
    this.$el.off('keydown');
    if (this.props.doc) {
      this._dispose();
    }
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
    // -----------------
    doc.connect(this, {
      'document:changed': this.onDocumentChanged
    });
    this.connect(this, {
      "selection:changed": this.onSelectionChanged
    });
  };

  this._dispose = function() {
    this.props.doc.disconnect(this);
    var clipboard = this.getClipboard();
    clipboard.detach(this.$el[0]);
    this.disconnect(this);
    this.dispose();
  };

  this.getChildContext = function() {
    return {
      config: this.props.config,
      controller: this,
      componentRegistry: this.componentRegistry,
      toolManager: this.toolManager
    };
  };

  this.getDocument = function() {
    return this.props.doc;
  };

  this.onSelectionChanged = function(/*sel, surface*/) {
    // no-op, should be overridden by custom writer
  };

  this.handleStateUpdate = function() {
    // no-op, should be overridden by custom writer
  };

  this.willUpdateState = function(newState) {
    this.handleStateUpdate(newState);
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
    options = options || {};
    this.setState(newState);
    if (options.restoreSelection) {
      this.restoreSelection();
    }
  };

  // handles 'switch-context'
  this.switchContext = function(contextId, options) {
    options = options || {};
    this.setState({ contextId: contextId });
    if (options.restoreSelection) {
      this.restoreSelection();
    }
  };

  this.restoreSelection = function() {
    var surface = this.getSurface('body');
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

};

OO.inherit(Writer, Controller);

module.exports = Writer;
