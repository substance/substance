'use strict';

var extend = require('lodash/extend');
var omit = require('lodash/omit');
var Controller = require("./Controller");
var Component = require('./Component');
var $$ = Component.$$;
var TOC = require('./TOC');
var Highlights = require('./Highlights');
var TabbedPane = require('./TabbedPane');
var SplitPane = require('./SplitPane');
var StatusBar = require('./StatusBar');
var Toolbar = require('./Toolbar');
var ScrollPane = require('./ScrollPane');
var ContainerEditor = require('./ContainerEditor');


var I18n = require('./i18n');
I18n.instance.load(require('../i18n/en'));

function TwoPanelController() {
  TwoPanelController.super.apply(this, arguments);

  this.toc = new TOC(this);
  this.contentHighlights = new Highlights(this.getDocument());
  this.handleApplicationKeyCombos = this.handleApplicationKeyCombos.bind(this);

  // action handlers
  this.handleActions({
    'switchState': this.switchState,
    'switchTab': this.switchContext,
    'switchContext': this.switchContext,
    'tocEntrySelected': this.tocEntrySelected,
    'closeDialog': this.closeDialog
  });
}

TwoPanelController.Prototype = function() {

  var _super = Object.getPrototypeOf(this);

  this.getChildContext = function() {
    var childContext = _super.getChildContext.call(this);
    return extend(childContext, {
      toc: this.toc,
      i18n: I18n.instance,
    });
  };

  this.getInitialState = function() {
    return {'contextId': 'toc'};
  };

  this.getContentPanel = function() {
    // the render method is currently to custom to be able to
    // provide a default implementation
    throw new Error('This method is abstract.');
  };

  this.didMount = function() {
    if (this.state.nodeId && this.state.contextId === 'toc') {
      this.getContentPanel().scrollTo(this.state.nodeId);
    }
  };

  this.didUpdateState = function() {
    if (this.state.nodeId && this.state.contextId === 'toc') {
      this.getContentPanel().scrollTo(this.state.nodeId);
    }
  };

  this.render = function() {
    // TODO: maybe make status bar configurable
    return _super.render.call(this)
      .append(
        $$(SplitPane, {splitType: 'horizontal', sizeB: 'inherit'}).append(
          $$(SplitPane, {splitType: 'vertical', sizeA: '60%'}).append(
            // TODO: provide a default implementation here
            this._renderMainSection(),
            this._renderContextSection()
          ).ref('splitPane'),
          $$(StatusBar, {doc: this.props.doc}).ref('statusBar')
        ).ref('workspaceSplitPane')
      );
  };

  this._renderToolbar = function() {
    return $$(Toolbar).ref('toolbar');
  };

  this._renderMainSection = function() {
    return $$('div').ref('main').addClass('se-main-section').append(
      $$(SplitPane, {splitType: 'horizontal'}).append(
        this._renderToolbar(),
        // Content Panel below
        $$(ScrollPane, {
          scrollbarType: 'substance',
          scrollbarPosition: 'left',
          toc: this.toc,
          highlights: this.contentHighlights
        }).ref('contentPanel').append(
          this._renderContentPanel()
        )
      ).ref('mainSectionSplitPane')
    );
  };

  this._renderContentPanel = function() {
    var config = this.getConfig();
    var containerId = config.containerId;
    var containerConfig = config[containerId];
    // The full fledged document (ContainerEditor)
    return $$("div").ref('main').addClass('document-content').append(
      $$(ContainerEditor, {
        name: 'main',
        containerId: containerId,
        commands: containerConfig.commands,
        textTypes: containerConfig.textTypes
      }).ref('mainEditor')
    );
  };

  this._renderContextSection = function() {
    var config = this.getConfig();
    var panelProps = this._panelPropsFromState();
    var contextId = this.state.contextId;
    var panels = config.panels || {};
    var panelConfig = panels[this.state.contextId] || {};
    var tabOrder = config.tabOrder || [];
    var PanelComponentClass = this.componentRegistry.get(contextId);

    var tabs = tabOrder.map(function(contextId) {
      return {
        id: contextId,
        name: this.i18n.t(contextId)
      };
    }.bind(this));

    var el = $$('div').addClass('se-context-section').ref('contextSection');
    var panelEl = $$(PanelComponentClass, panelProps).ref(contextId);

    // Use full space if panel is configured as a dialog
    if (panelConfig.isDialog) {
      el.append(panelEl);
    } else {
      el.append(
        $$(TabbedPane, {
          activeTab: contextId,
          tabs: tabs,
        }).ref(this.state.contextId).append(
          panelEl
        )
      );
    }
    return el;
  };

  // Action handlers
  // ---------------

  // handles 'switchState'
  this.switchState = function(newState, options) {
    options = options || {};
    this.setState(newState);
    if (options.restoreSelection) {
      this.restoreSelection();
    }
  };

  // handles 'switchContext' and 'switchTab'
  this.switchContext = function(tabId, options) {
    options = options || {};
    this.setState({ contextId: tabId });
    if (options.restoreSelection) {
      this.restoreSelection();
    }
  };

  this.tocEntrySelected = function(nodeId) {
    this.extendState({
      nodeId: nodeId
    });
  };

  this.closeDialog = function() {
    // show the TOC by default
    this.setState({ contextId: 'toc' });
  };


  // other API

  this.restoreSelection = function() {
    var surface = this.getSurface('body');
    surface.rerenderDomSelection();
  };

  this.uploadFile = function(file, cb) {
    // This is a testing implementation
    if (this.props.onUploadFile) {
      return this.props.onUploadFile(file, cb);
    } else {
      // Default file upload implementation
      // We just return a temporary objectUrl
      var fileUrl = window.URL.createObjectURL(file);
      cb(null, fileUrl);
    }
  };

  this.handleStateUpdate = function(newState) {
    /* jshint unused: false */
  };

  // Extract props needed for panel parametrization
  this._panelPropsFromState = function() {
    var props = omit(this.state, 'contextId');
    props.doc = this.getDocument();
    return props;
  };

};
Controller.extend(TwoPanelController);

module.exports = TwoPanelController;
