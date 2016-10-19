import AbstractEditor from '../../ui/AbstractEditor'
import ContainerEditor from '../../ui/ContainerEditor'
import ProseEditorOverlayTools from './ProseEditorOverlayTools'
import Toolbar from '../tools/Toolbar'

/**
  Configurable ProseEditor component

  @example

  ```js
  const cfg = new Configurator()
  cfg.import(ProseEditorPackage)
  cfg.import(SuperscriptPackage)

  window.onload = function() {
    let doc = configurator.createArticle(fixture)
    let documentSession = new DocumentSession(doc)
    ProseEditor.mount({
      documentSession: documentSession,
      configurator: configurator
    }, document.body)
  }
  ```
*/
class ProseEditor extends AbstractEditor {

  didMount() {
    super.didMount()

    this.editSession.on('render', this._onCommandStatesChanged, this)
  }

  dispose() {
    super.dispose()

    this.editSession.off(this)
  }

  render($$) {
    let SplitPane = this.componentRegistry.get('split-pane')
    let el = $$('div').addClass('sc-prose-editor')
    let toolbar = this._renderToolbar($$)
    let editor = this._renderEditor($$)
    let ScrollPane = this.componentRegistry.get('scroll-pane')

    let contentPanel = $$(ScrollPane, {
      scrollbarPosition: 'right',
      scrollbarType: this.props.scrollbarType,
      overlay: ProseEditorOverlayTools,
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
    let commandStates = this.commandManager.getCommandStates()
    return $$(Toolbar, {
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

  _onCommandStatesChanged(editSession) {
    if (editSession.hasChanged('commandStates')) {
      let toolbar = this.refs.toolbar
      if (toolbar) {
        let commandStates = this.commandManager.getCommandStates()
        toolbar.setProps({
          commandStates: commandStates
        })
      }
    }
  }
}

export default ProseEditor
