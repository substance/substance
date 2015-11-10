var ContentPanel = require("../ui/ContentPanel");
var StatusBar = require("../ui/StatusBar");
var ContextToggles = require('../ui/ContextToggles');
var ContainerRenderer = require('./components/ContainerRenderer');
var Component = require('../ui/Component');
var $$ = Component.$$;
var DocumentationController = require('./DocumentationController');
var $ = require('../util/jquery');

var DocumentationReader = DocumentationController.extend({
  // Editor configuration
  static: {
    config: {
      // Controller specific configuration (required!)
      controller: {
        // Component registry
        components: {
          'class': require('./components/ClassComponent'),
          'namespace': require('./components/NamespaceComponent'),
          'function': require('./components/FunctionComponent'),
          'method': require('./components/MethodComponent'),
          'module': require('./components/ModuleComponent'),
          'component': require('./components/ComponentComponent'),
          'property': require('./components/PropertyComponent'),
          'event': require('./components/EventComponent'),
          'toc': require('./components/DocumentationTocPanel')
        }
      },
      panelOrder: ['toc'],
      containerId: 'body',
      isEditable: false,
      skipAbstractClasses: false,
      skipPrivateMethods: true
    }
  },

  render: function() {
    var doc = this.props.doc;
    var config = this.getConfig();
    var el = $$('div').addClass('sc-documentation-reader sc-controller')
      // TODO: we need to support event delegation
      .on('click', this.onClickCrossLink);

    el.append(
      $$('div').ref('workspace').addClass('se-workspace').append(
        // Main (left column)
        $$('div').ref('main').addClass("se-main").append(
          $$(ContentPanel).append(
            // The main container
            // $$("div").ref('main').addClass('document-content').append(
            $$(ContainerRenderer, {
              containerId: config.containerId
            }).ref('mainAnnotator')
            // )
          ).ref('content')
        ),
        // Resource (right column)
        $$('div').ref('resource')
          .addClass("se-resource")
          .append(
            $$(ContextToggles, {
              panelOrder: config.panelOrder,
              contextId: this.state.contextId
            }).ref("context-toggles"),
            this.renderContextPanel()
          )
      )
    );

    // Status bar
    el.append(
      $$(StatusBar, {doc: doc}).ref('statusBar')
    );
    return el;
  },

  didMount: function() {
    if (this.state.nodeId) {
      this.jumpToNode(this.state.nodeId);
    }
  },

  didRender: function() {
    if (this.state.nodeId) {
      this.jumpToNode(this.state.nodeId);
    }
  },

  onClickCrossLink: function(e) {
    var $target = $(e.target);
    if ($target.is('a[data-type="cross-link"]')) {
      e.preventDefault();
      e.stopPropagation();
      var nodeId = $target.attr('data-node-id');
      this.extendState({
        nodeId: nodeId
      });
    }
  }
});

module.exports = DocumentationReader;