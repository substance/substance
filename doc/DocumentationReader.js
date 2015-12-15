var ContentPanel = require("../ui/ContentPanel");
var ContainerRenderer = require('./components/ContainerRenderer');
var Component = require('../ui/Component');
var $$ = Component.$$;
var DocumentationController = require('./DocumentationController');
var Cover = require('./components/CoverComponent');
var ContextSection = require('../ui/ContextSection');

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
          'property': require('./components/PropertyComponent'),
          'event': require('./components/EventComponent'),
          'toc': require('../ui/TOCPanel')
        }
      },
      panels: {
        'toc': {
          hideContextToggles: true
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
    var el = $$('div').addClass('sc-documentation-reader sc-controller');

    el.append(
      $$('div').ref('workspace').addClass('se-workspace').append(
        // Main (left column)
        $$('div').ref('main').addClass("se-main").append(
          $$(ContentPanel).append(
            $$(Cover, {node: meta}).ref('cover'),
            $$(ContainerRenderer, {
              containerId: config.containerId
            }).ref('mainAnnotator')
          ).ref('contentPanel')
        ),
        // Resource (right column)
        $$('div').ref('resource')
          .addClass('se-resource')
          .append(
            $$(ContextSection, {
              panelProps: this._panelPropsFromState(),
              contextId: this.state.contextId,
              panelConfig: config.panels[this.state.contextId],
            }).ref(this.state.contextId)
          )
      )
    );

    return el;
  }
});

module.exports = DocumentationReader;