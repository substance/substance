'use strict';

var ContainerRenderer = require('./components/ContainerRenderer');
var DocumentationTOCProvider = require('./DocumentationTOCProvider');
var Component = require('../ui/Component');
var Cover = require('./components/CoverComponent');
var TOC = require('../ui/TOC');
var SplitPane = require('../ui/SplitPane');
var ScrollPane = require('../ui/ScrollPane');
var DocumentationRouter = require('./DocumentationRouter');

function DocumentationReader() {
  DocumentationReader.super.apply(this, arguments);

  this._initialize(this.props);

  this.handleActions({
    'switchState': this.switchState,
    'extendState': this.extendState,
    'tocEntrySelected': this.focusNode,
    'focusNode': this.focusNode
  });
}

DocumentationReader.Prototype = function() {

  this._initialize = function(props) {
    var configurator = props.configurator;

    this.config = DocumentationReader.static.config;
    this.router = new DocumentationRouter(this);
    this.router.on('route:changed', this._onRouteChanged, this);
    this.tocProvider = new DocumentationTOCProvider(this.props.doc, this.config);
    this.componentRegistry = configurator.getComponentRegistry();
    this.iconProvider = configurator.getIconProvider();
    this.labelProvider = configurator.getLabelProvider();
  };

  this.getChildContext = function() {
    return {
      doc: this.getDocument(),
      config: this.config,
      tocProvider: this.tocProvider,
      componentRegistry: this.componentRegistry,
      iconProvider: this.iconProvider,
      labelProvider: this.labelProvider
    };
  };

  this.getDocument = function() {
    return this.props.doc;
  };

  // this increases rerendering speed alot.
  // A deep rerender takes quite a time (about 400ms) because of the many components.
  // We can do this as long the content is not changed depending on the state
  // -- just updating scroll position ATM.
  this.shouldRerender = function() {
    return false;
  };

  this.navigate = function(route, opts) {
    this.extendState(route);
    this.router.writeRoute(route, opts);
  };

  this._onRouteChanged = function(route) {
    this.navigate(route, {replace: true});
  };

  this.dispose = function() {
    this.router.dispose();
  };

  // Action handlers
  // ---------------

  this.focusNode = function(nodeId) {
    this.navigate({
      nodeId: nodeId
    });
  };

  this.switchState = function(newState) {
    this.navigate(newState);
  };

  this.jumpToNode = function(nodeId) {
    this.tocProvider.emit("entry:selected", nodeId);
  };

  this.didMount = function() {
    var route = this.router.readRoute();
    // Replaces the current entry without creating new history entry
    // or triggering hashchange
    this.navigate(route, {replace: true});
    this._updateScrollPosition();
  };

  this.didUpdate = function() {
    this._updateScrollPosition();
  };

  this.render = function($$) {
    return $$('div').addClass('sc-documentation-reader sc-controller').append(
      $$(SplitPane, {splitType: 'vertical', sizeA: '270px'}).append(
        this._renderContextSection($$),
        this._renderMainSection($$)
      ).ref('splitPane')
    );
  };

  this._renderContextSection = function($$) {
    var el = $$('div')
      .addClass('se-context-section')
      .ref('contextSection')
      .append(
        $$(TOC)
      );

    return el;
  };

  this._renderMainSection = function($$) {
    var config = this.config;
    var doc = this.props.doc;
    var meta = doc.get('meta');

    return $$('div').ref('main').addClass('se-main-section').append(
      $$(ScrollPane, {
        tocProvider: this.tocProvider
      }).ref('contentPanel').append(
        $$(Cover, {node: meta}).ref('cover'),
        $$(ContainerRenderer, {
          containerId: config.containerId
        }).ref('containerRenderer')
      )
    );
  };

  this._updateScrollPosition = function() {
    if (this.refs.contentPanel && this.state.nodeId) {
      this.refs.contentPanel.scrollTo(this.state.nodeId);
    }
  };
};

Component.extend(DocumentationReader);

// TODO: we should move this into a DocumentationConfigurator API
DocumentationReader.static.config = {
  containerId: 'body',
  skipAbstractClasses: false,
  skipPrivateMethods: true
};

module.exports = DocumentationReader;