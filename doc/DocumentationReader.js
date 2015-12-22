var ContentPanel = require("../ui/ContentPanel");
var ContainerRenderer = require('./components/ContainerRenderer');
var Component = require('../ui/Component');
var $$ = Component.$$;
var DocumentationController = require('./DocumentationController');
var Cover = require('./components/CoverComponent');
var TabbedPane = require('../ui/TabbedPane');
var SplitPane = require('../ui/SplitPane');

function DocumentationReader() {
  DocumentationController.apply(this, arguments);
}

DocumentationReader.Prototype = function() {
  // Used by two-column apps
  this._renderContextSection = function() {
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

  this._renderMainSection = function() {
    var config = this.getConfig();
    var doc = this.props.doc;
    var meta = doc.get('meta');

    return $$('div').ref('main').addClass('se-main-section').append(
      $$(ContentPanel, {scrollbarType: 'native', scrollbarPosition: 'right'}).append(
        $$(Cover, {node: meta}).ref('cover'),
        $$(ContainerRenderer, {
          containerId: config.containerId
        }).ref('mainAnnotator')
      ).ref('contentPanel')
    );
  };

  this.render = function() {
    return $$('div').addClass('sc-documentation-reader sc-controller').append(
      $$(SplitPane, {splitType: 'vertical', sizeA: '270px'}).append(
        this._renderContextSection(),
        this._renderMainSection()
      ).ref('splitPane')
    );
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