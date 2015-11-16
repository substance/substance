'use strict';

var _ = require('../util/helpers');

var oo = require('../util/oo');
var Controller = require("../ui/Controller");
var Component = require('../ui/Component');
var $$ = Component.$$;
var Router = require('../ui/Router');

// Substance is i18n ready, but by now we did not need it
// Thus, we configure I18n statically as opposed to loading
// language files for the current locale
var I18n = require('../ui/i18n');
I18n.instance.load(require('./i18n/en'));


function DocumentationController(parent, params) {
  Controller.call(this, parent, params);

  this.handleApplicationKeyCombos = this.handleApplicationKeyCombos.bind(this);

  // action handlers
  this.actions({
    "switchState": this.switchState,
    "extendState": this.extendState,
    "switchContext": this.switchContext,
    'focusNode': this.focusNode
  });
}

DocumentationController.Prototype = function() {
  
  this.focusNode = function(nodeId) {
    console.log('focussing node', nodeId);
    this.extendState({
      nodeId: nodeId
    });
  };

  this.getInitialContext = function() {
    return {
      router: new Router(this)
    };
  };

  // Some things should go into controller
  this.getChildContext = function() {
    var childContext = Controller.prototype.getChildContext.call(this);
    return _.extend(childContext, {
      i18n: I18n.instance,
    });
  };

  this.getInitialState = function() {
    return {'contextId': 'toc'};
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

  this.jumpToNode = function(nodeId) {
    this.props.doc.emit("toc:entry-selected", nodeId);
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
      // I set ref to the current contextId so we don't run into #173
      return $$(ComponentClass, this._panelPropsFromState(this.state)).ref(this.state.contextId);
    } else {
      console.warn("Could not find component for contextId:", this.state.contextId);
    }
  };

  this.renderContextPanel = function() {
    var panelElement = this.getActivePanelElement();
    if (!panelElement) {
      return $$('div').append("No panels are registered");
    } else {
      return $$('div').append(panelElement);
    }
  };

  // Hande Writer state change updates
  // --------------
  //
  // Here we update highlights

  this.handleStateUpdate = function(newState) {
    // var oldState = this.state;
    var doc = this.getDocument();

    function getActiveNodes(state) {
      if (state.contextId === 'editSource') {
        return [ state.nodeId ];
      }
      return [];
    }

    var activeAnnos = getActiveNodes(newState);
    // HACK: updates the highlights when state
    // transition has finished
    setTimeout(function() {
      doc.setHighlights(activeAnnos);
    }, 0);
  };

};

oo.inherit(DocumentationController, Controller);

module.exports = DocumentationController;