'use strict';

var extend = require('lodash/extend');
var Controller = require('../ui/Controller');
var DocumentationRouter = require('./DocumentationRouter');
var omit = require('lodash/omit');
var DocumentationTOC = require('./DocumentationTOC');

var I18n = require('../ui/i18n');
I18n.instance.load(require('./i18n/en'));

function DocumentationController() {
  DocumentationController.super.apply(this, arguments);

  this.router = new DocumentationRouter(this);
  this.toc = new DocumentationTOC(this);

  this.handleActions({
    'switchState': this.switchState,
    'extendState': this.extendState,
    'switchContext': this.switchContext,
    'tocEntrySelected': this.focusNode,
    'focusNode': this.focusNode
  });
}

DocumentationController.Prototype = function() {

  var _super = DocumentationController.super.prototype;

  // HACK: For some reasons this.refs.contentPanel disappears after 2nd state update
  // so we work around by caching this.refs.contentPanel.refs.scrollPane
  this.didMount = function() {
    _super.didMount.call(this);

    this.router.readURL();
  };

  this.dispose = function() {
    _super.dispose.call(this);

    this.router.dispose();
  };

  this.getChildContext = function() {
    var childContext = Controller.prototype.getChildContext.call(this);
    return extend(childContext, {
      toc: this.toc,
      i18n: I18n.instance,
    });
  };

  this.getInitialState = function() {
    return {'contextId': 'toc'};
  };

  // Action handlers
  // ---------------

  this.focusNode = function(nodeId) {
    this._focusNode(nodeId);
    this.router.writeURL();
  };

  this.switchState = function(newState) {
    // make sure default state is set
    if (!newState.contextId) {
      newState = extend({}, this.getInitialState(), newState);
    }
    this.setState(newState);
  };

  this.switchContext = function(contextId) {
    this.switchState({
      contextId: contextId
    });
  };

  this.jumpToNode = function(nodeId) {
    this.toc.emit("entry:selected", nodeId);
  };

  // Private methods
  // ---------------

  this._focusNode = function(nodeId) {
    this.extendState({ nodeId: nodeId });
  };

  // TODO: we should try to achieve a more Component idiomatic implementation
  this._panelPropsFromState = function() {
    var props = omit(this.state, 'contextId');
    props.doc = this.getDocument();
    return props;
  };

};

Controller.extend(DocumentationController);

module.exports = DocumentationController;
