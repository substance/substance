'use strict';

var ContainerRenderer = require('./components/ContainerRenderer');
var DocumentationController = require('./DocumentationController');
var Cover = require('./components/CoverComponent');
var TabbedPane = require('../ui/TabbedPane');
var SplitPane = require('../ui/SplitPane');
var ScrollPane = require('../ui/ScrollPane');
var DocumentationRouter = require('./DocumentationRouter');

function DocumentationReader() {
  DocumentationReader.super.apply(this, arguments);

  this.router = new DocumentationRouter(this);
}

DocumentationReader.Prototype = function() {

  var _super = DocumentationReader.super.prototype;

  // this increases rerendering speed alot.
  // A deep rerender takes quite a time (about 400ms) because of the many components.
  // We can do this as long the content is not changed depending on the state
  // -- just updating scroll position ATM.
  this.shouldRerender = function() {
    return false;
  };

  this.didMount = function() {
    _super.didMount.call(this);
    this._updateScrollPosition();
  };

  this.didUpdate = function() {
    _super.didUpdate.call(this);
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
    var config = this.getConfig();
    var panelProps = this._panelPropsFromState();
    var contextId = this.state.contextId;
    var panels = config.panels || {};
    var panelConfig = panels[this.state.contextId] || {};
    var tabOrder = config.tabOrder;
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

  this._renderMainSection = function($$) {
    var config = this.getConfig();
    var doc = this.props.doc;
    var meta = doc.get('meta');

    return $$('div').ref('main').addClass('se-main-section').append(
      $$(ScrollPane, {
        toc: this.toc
      }).ref('contentPanel').append(
        $$(Cover, {node: meta}).ref('cover'),
        $$(ContainerRenderer, {
          containerId: config.containerId
        }).ref('mainAnnotator')
      )
    );
  };

  this._updateScrollPosition = function() {
    if (this.refs.contentPanel && this.state.nodeId) {
      this.refs.contentPanel.scrollTo(this.state.nodeId);
    }
  };

};

DocumentationController.extend(DocumentationReader);

DocumentationReader.static.config = {
  // Controller specific configuration (required)
  controller: {
    // Component registry
    components: {
      'namespace': require('./components/NamespaceComponent'),
      'function': require('./components/FunctionComponent'),
      'class': require('./components/SubstanceClassComponent'),
      'ctor': require('./components/ConstructorComponent'),
      'method': require('./components/MethodComponent'),
      'module': require('./components/ModuleComponent'),
      'property': require('./components/PropertyComponent'),
      'event': require('./components/EventComponent'),
      'toc': require('../ui/TOCPanel')
    }
  },
  panels: {
    'toc': {
      isDialog: true
    }
  },
  tabOrder: ['toc'],
  containerId: 'body',
  isEditable: false,
  skipAbstractClasses: false,
  skipPrivateMethods: true
};

module.exports = DocumentationReader;