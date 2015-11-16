var ContentPanel = require("../ui/ContentPanel");
var ContainerRenderer = require('./components/ContainerRenderer');
var Component = require('../ui/Component');
var $$ = Component.$$;
var DocumentationController = require('./DocumentationController');
var $ = require('../util/jquery');
var Cover = require('./components/CoverComponent');

var DocumentationReader = DocumentationController.extend({
  // Editor configuration
  static: {
    config: {
      // Controller specific configuration (required!)
      controller: {
        // Component registry
        components: {
          'namespace': require('./components/NamespaceComponent'),
          'function': require('./components/FunctionComponent'),
          'class': require('./components/SubstanceClassComponent'),
          'ctor': require('./components/ConstructorComponent'),
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
    var meta = doc.get('meta');
    var config = this.getConfig();
    var el = $$('div').addClass('sc-documentation-reader sc-controller')
      // TODO: we need to support event delegation
      .on('click', this.onClickCrossLink);

    el.append(
      $$('div').ref('workspace').addClass('se-workspace').append(
        // Main (left column)
        $$('div').ref('main').addClass("se-main").append(
          $$(ContentPanel).append(
            $$(Cover, {node: meta}),
            $$(ContainerRenderer, {
              containerId: config.containerId
            }).ref('mainAnnotator')
          ).ref('content')
        ),
        // Resource (right column)
        $$('div').ref('resource')
          .addClass('se-resource')
          .append(
            this.renderContextPanel()
          )
      )
    );

    return el;
  },

  didMount: function() {
    if (this.state.nodeId) {
      this.jumpToNode(this.state.nodeId);
    }
  },

  didUpdateState: function() {
    if (this.state.nodeId) {
      this.jumpToNode(this.state.nodeId);
    }
  },

  // TODO: we can get rid of this, if we use
  // send('focusNode', nodeId) in all child components
  onClickCrossLink: function(e) {
    var $target = $(e.target);
    if ($target.is('a[data-type="cross-link"]')) {
      e.preventDefault();
      e.stopPropagation();
      var nodeId = $target.attr('data-node-id');
      this.focusNode(nodeId);
    }
  }
});

module.exports = DocumentationReader;