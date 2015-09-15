'use strict';

var _ = require("../../basics/helpers");
var Component = require('../component');
var Surface = require('../../surface');
var Registry = require('../../basics/registry');
var ContainerComponent = require('../nodes/container_node_component');
var SubstanceArticle = require("../../article");
var DefaultToolbar = require('./default_toolbar');
var ListEditing = require('../../document/transformations/extensions/list_editing');

var $$ = Component.$$;
var Clipboard = Surface.Clipboard;
var SurfaceManager = Surface.SurfaceManager;
var ContainerEditor = Surface.ContainerEditor;

var defaultComponents = {
  "paragraph": require('../nodes/paragraph_component'),
  "heading": require('../nodes/heading_component'),
  "blockquote": require('../nodes/blockquote_component'),
  "codeblock": require('../nodes/codeblock_component'),
  "list": require('../nodes/list_component'),
  "link": require('../nodes/link_component')
};

// TODO: discuss how to organize editor extensions
var editingBehavior = [ new ListEditing() ];

// Editor
// ----------------
//
// A simple rich text editor implementation based on Substance

var Editor = Component.extend({

  displayName: "Editor",

  didInitialize: function() {
    if (!this.config) this.config = {};

    var ArticleClass = this.config.article || SubstanceArticle;
    var components = this.config.components || defaultComponents;


    this.doc = new ArticleClass();
    this.doc.loadHtml(this.props.content);

    // Editing Surface
    this.surfaceManager = new SurfaceManager(this.doc);
    this.clipboard = new Clipboard(this.surfaceManager, this.doc.getClipboardImporter(), this.doc.getClipboardExporter());
    this.editor = new ContainerEditor('body');

    // Editing behavior
    _.each(editingBehavior, function(behavior) {
      this.editor.extendBehavior(behavior);
    }, this);

    // Component registry
    this.componentRegistry = new Registry();
    _.each(components, function(ComponentClass, name) {
      this.componentRegistry.add(name, ComponentClass);
    }, this);

    // Dependency Injection
    this.childContext = {
      componentRegistry: this.componentRegistry,
      surfaceManager: this.surfaceManager,
      document: this.doc
    };
  },

  render: function() {
    var el = $$('div').addClass('editor-component');

    // Toolbar
    var ToolbarClass = this.config.toolbar || DefaultToolbar;
    var toolbar = $$(ToolbarClass);
    toolbar.ref('toolbar');
    el.append(toolbar);

    // Content Container
    el.append(
      $$(ContainerComponent, {
        doc: this.doc,
        node: this.doc.get('body'),
        editor: this.editor,
        commands: this.config.commands
      })
      .ref('bodyContainer')
      .attr({ contentEditable: true })
    );
    return el;
  },

  didReceiveProps: function() {
    if (this.doc.toHtml() !== this.props.content) {
      this.doc.loadHtml(this.props.content);
    }
  },

  didMount: function() {
    this.clipboard.attach(this.$el[0]);
  },

  willUnmount: function() {
    this.dispose();
  },

  dispose: function() {
    var clipboard = this.clipboard;
    var surfaceManager = this.surfaceManager;
    if (clipboard) clipboard.detach(this.$el[0]);
    if (surfaceManager) surfaceManager.dispose();
  },

  getContent: function() {
    return this.doc.toHtml();
  },

  getDocument: function() {
    return this.doc;
  }
});

module.exports = Editor;
