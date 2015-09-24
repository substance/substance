'use strict';

var _ = require("../../basics/helpers");
var Component = require('../component');
var ContainerComponent = require('../nodes/container_node_component');
var SubstanceArticle = require("../../article");
var DefaultToolbar = require('./default_toolbar');
var ListEditing = require('../../document/transformations/extensions/list_editing');

var $$ = Component.$$;
var Controller = require('../controller');
var ContainerEditor = require('../surface/container_editor');

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

    this.doc = new ArticleClass();
    this.doc.loadHtml(this.props.content);

    // Initialize controller
    this.controller = new Controller(this.doc, {
      components: this.config.components || defaultComponents,
      commands: this.config.commands
    });

    this.editor = new ContainerEditor('body');

    // Editing behavior
    _.each(editingBehavior, function(behavior) {
      this.editor.extendBehavior(behavior);
    }, this);

    // Dependency Injection
    this.childContext = {
      controller: this.controller
    };
  },

  getController: function() {
    return this.controller;
  },

  selectAll: function() {
    // Make sure the surface is focussed
    var surface = this.getController().getSurface('body');
    surface.setFocused(true);
    // Then send selectAll command
    this.executeCommand('selectAll');
  },

  executeCommand: function(commandName) {
    return this.controller.executeCommand(commandName);
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
    this.controller.clipboard.attach(this.$el[0]);
  },

  willUnmount: function() {
    this.dispose();
  },

  dispose: function() {
    var clipboard = this.controller.clipboard;
    if (clipboard) clipboard.detach(this.$el[0]);
    this.controller.dispose();
  },

  getContent: function() {
    return this.doc.toHtml();
  },

  getDocument: function() {
    return this.doc;
  }
});

module.exports = Editor;
