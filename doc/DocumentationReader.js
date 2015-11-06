var Documentation = require('./model/Documentation');

var ContentPanel = require("../ui/ContentPanel");
var StatusBar = require("../ui/StatusBar");
var ContextToggles = require('../ui/ContextToggles');
// var ContainerAnnotator = require('../ui/ContainerAnnotator');

var Component = require('../ui/Component');
var $$ = Component.$$;
var DocumentationController = require('./DocumentationController');
var $ = require('../util/jquery');

// Tools
// --------------

var DocumentationReader = DocumentationController.extend({
  // Editor configuration
  static: {
    config: {
      // Controller specific configuration (required!)
      controller: {
        // Component registry
        components: {
          'toc': require('../ui/TocPanel')
        }
      },
      panelOrder: ['toc'],
      containerId: 'body',
      isEditable: false
    }
  },

  render: function() {
    var doc = this.props.doc;
    var config = this.getConfig();
    var el = $$('div').addClass('sc-documentation-reader sc-controller');

    el.append(
      $$('div').ref('workspace').addClass('se-workspace').append(
        // Main (left column)
        $$('div').ref('main').addClass("se-main").append(
          $$(ContentPanel).append(
            // The main container
            $$("div").ref('main').addClass('document-content').append(
              'HELLO SUBSTANCE DOCS'
              // $$(ContainerAnnotator, {
              //   name: 'main',
              //   containerId: 'main',
              //   editable: false,
              //   commands: config.main.commands
              // }).ref('mainAnnotator')
            )
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
  }
});

$(function() { 
  var doc = new Documentation();
  window.doc = doc;

  // Initial data seed
  doc.create({
    id: 'model',
    type: 'namespace',
    name: 'model',
    description: 'The model module provides utilities to define custom article models and manipulate them.'
  });
  
  doc.create({
    id: 'model/Document',
    type: 'class',
    name: 'Document',
    methods: ['model/Document#create'],
    props: ['model/Document#stage'],
    description: 'Abstract Substance Document class.'
  });

  doc.create({
    id: 'model/Document#create',
    type: 'method',
    name: 'create',
    description: 'Create a new node for the document'
  });

  doc.create({
    id: 'model/Document#stage',
    type: 'property',
    name: 'create',
    dataType: 'TransactionDocument',
    description: 'Create a new node for the document'
  });

  doc.create({
    id: 'model/documentHelpers',
    type: 'object',
    name: 'documentHelpers',
    properties: ['model/documentHelpers.isContainerAnnotation']
  });

  doc.create({
    id: 'model/documentHelpers.isContainerAnnotation',
    type: 'function',
    static: true,
    name: 'isContainerAnnotation',
    params: [
      {name: 'doc', type: 'model/Document', description: 'The document instance'},
      {name: 'type', type: 'String', description: 'Container annotation type'}
    ]
  });

  doc.create({
    id: 'ui',
    type: 'namespace',
    name: 'ui',
    description: 'UI Components for making up your <strong>editor</strong>.'
  });

  console.log('Documentation instance', doc);

  Component.mount($$(DocumentationReader, {
    doc: doc
  }), $('body'));
});
