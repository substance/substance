'use strict';

import AbstractEditor from '../../ui/AbstractEditor'
import ContainerEditor from '../../ui/ContainerEditor'
import ProseEditorOverlay from './ProseEditorOverlay'

class ProseEditor extends AbstractEditor {

  willUpdateState(newState) {
    this.handleStateUpdate(newState)
  }

  render($$) {
    let SplitPane = this.getComponent('split-pane')
    let el = $$('div').addClass('sc-prose-editor')

    let toolbar = this._renderToolbar($$)
    let editor = this._renderEditor($$)
    let ScrollPane = this.getComponent('scroll-pane')

    let contentPanel = $$(ScrollPane, {
      scrollbarType: 'substance',
      scrollbarPosition: 'right',
      overlay: ProseEditorOverlay,
    }).append(
      editor
    ).ref('contentPanel')

    el.append(
      $$(SplitPane, {splitType: 'horizontal'}).append(
        toolbar,
        contentPanel
      )
    )
    return el
  }

  _renderToolbar($$) {
    let configurator = this.props.configurator
    let ToolbarClass = configurator.getToolbarClass()
    let commandStates = this.commandManager.getCommandStates()
    return $$(ToolbarClass, {
      commandStates: commandStates
    }).ref('toolbar')
  }

  _renderEditor($$) {
    let configurator = this.props.configurator
    return $$(ContainerEditor, {
      disabled: this.props.disabled,
      documentSession: this.documentSession,
      node: this.doc.get('body'),
      commands: configurator.getSurfaceCommandNames(),
      textTypes: configurator.getTextTypes()
    }).ref('body')
  }

  getToolbar() {
    return this.refs.toolbar
  }

}

export default ProseEditor
