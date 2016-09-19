'use strict';

import AbstractEditor from '../../ui/AbstractEditor'
import ContainerEditor from '../../ui/ContainerEditor'
import ProseEditorOverlay from './ProseEditorOverlay'

function ProseEditor() {
  ProseEditor.super.apply(this, arguments);
}

ProseEditor.Prototype = function() {

  this.willUpdateState = function(newState) {
    this.handleStateUpdate(newState);
  };

  this.render = function($$) {
    var SplitPane = this.componentRegistry.get('split-pane');
    var el = $$('div').addClass('sc-prose-editor');

    var toolbar = this._renderToolbar($$);
    var editor = this._renderEditor($$);
    var ScrollPane = this.componentRegistry.get('scroll-pane');

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

export default ProseEditor;
