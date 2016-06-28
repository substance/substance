'use strict';

var AbstractEditor = require('../../ui/AbstractEditor');
var ContainerEditor = require('../../ui/ContainerEditor');
var SplitPane = require('../../ui/SplitPane');
var ScrollPane = require('../../ui/ScrollPane');
var ProseEditorOverlay = require('./ProseEditorOverlay');

function ProseEditor() {
  ProseEditor.super.apply(this, arguments);
}

ProseEditor.Prototype = function() {

  this.willUpdateState = function(newState) {
    this.handleStateUpdate(newState);
  };

  this.render = function($$) {
    var el = $$('div').addClass('sc-prose-editor');

    var toolbar = this._renderToolbar($$);
    var editor = this._renderEditor($$);

    var contentPanel = $$(ScrollPane, {
      scrollbarType: 'substance',
      scrollbarPosition: 'right',
      overlay: ProseEditorOverlay,
    }).append(
      editor
    ).ref('contentPanel');

    el.append(
      $$(SplitPane, {splitType: 'horizontal'}).append(
        toolbar,
        contentPanel
      )
    );
    return el;
  };

  this._renderToolbar = function($$) {
    var configurator = this.props.configurator;
    var ToolbarClass = configurator.getToolbarClass();
    var commandStates = this.commandManager.getCommandStates();
    return $$(ToolbarClass, {
      commandStates: commandStates
    }).ref('toolbar');
  };

  this._renderEditor = function($$) {
    var configurator = this.props.configurator;
    return $$(ContainerEditor, {
      disabled: this.props.disabled,
      documentSession: this.documentSession,
      node: this.doc.get('body'),
      commands: configurator.getSurfaceCommandNames(),
      textTypes: configurator.getTextTypes()
    }).ref('body');
  };

  this.getToolbar = function() {
    return this.refs.toolbar;
  };

};

AbstractEditor.extend(ProseEditor);

module.exports = ProseEditor;
