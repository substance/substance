import { AbstractEditor, ContainerEditor, WorkflowPane } from '../../ui'
import Toolbar from '../toolbar/Toolbar'

/**
  Configurable ProseEditor component

  @example

  ```js
  const cfg = new Configurator()
  cfg.import(ProseEditorPackage)
  cfg.import(SuperscriptPackage)

  window.onload = function() {
    let doc = configurator.createArticle(fixture)
    let editorSession = new EditorSession(doc, {
      configurator: configurator
    })
    ProseEditor.mount({
      editorSession: editorSession
    }, document.body)
  }
  ```
*/
class ProseEditor extends AbstractEditor {

  render($$) {
    let SplitPane = this.componentRegistry.get('split-pane')
    let el = $$('div').addClass('sc-prose-editor')
    let toolbar = this._renderToolbar($$)
    let editor = this._renderEditor($$)
    let configurator = this.getConfigurator()
    let ScrollPane = this.componentRegistry.get('scroll-pane')
    let Overlay = this.componentRegistry.get('overlay')
    let ContextMenu = this.componentRegistry.get('context-menu')
    let Dropzones = this.componentRegistry.get('dropzones')

    let contentPanel = $$(ScrollPane, {
      name: 'contentPanel',
      contextMenu: this.props.contextMenu || 'native',
      scrollbarPosition: 'right',
      scrollbarType: this.props.scrollbarType
    }).append(
      editor,
      $$(Overlay, {
        toolPanel: configurator.getToolPanel('main-overlay'),
        theme: 'dark'
      }),
      $$(ContextMenu),
      $$(Dropzones)
    ).ref('contentPanel')

    el.append(
      $$(SplitPane, {splitType: 'horizontal'}).append(
        toolbar,
        $$(SplitPane, {splitType: 'horizontal', sizeB: 'inherit'}).append(
          contentPanel,
          $$(WorkflowPane, {
            toolPanel: configurator.getToolPanel('workflow')
          })
        )
      )
    )
    return el
  }

  _renderToolbar($$) {
    let configurator = this.getConfigurator()
    return $$('div').addClass('se-toolbar-wrapper').append(
      $$(Toolbar, {
        toolPanel: configurator.getToolPanel('toolbar')
      }).ref('toolbar')
    )
  }

  _renderEditor($$) {
    let configurator = this.getConfigurator()
    return $$(ContainerEditor, {
      disabled: this.props.disabled,
      editorSession: this.editorSession,
      node: this.doc.get('body'),
      commands: configurator.getSurfaceCommandNames()
    }).ref('body')
  }
}

export default ProseEditor
