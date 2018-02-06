import ToggleTool from '../../ui/ToggleTool'

/**
  Tool for editing an existing link.

  Designed so that it can be used either in a toolbar, or within
  an overlay on the Surface.

  @component
*/

class EditLinkTool extends ToggleTool {

  getUrlPath() {
    let propPath = this.constructor.urlPropertyPath
    return [this.getNodeId()].concat(propPath)
  }

  getNodeId() {
    return this.props.commandState.nodeId
  }

  _openLink() {
    let doc = this.context.editorSession.getDocument()
    window.open(doc.get(this.getUrlPath()), '_blank')
  }

  render($$) {
    let Input = this.getComponent('input')
    let Button = this.getComponent('button')
    let commandState = this.props.commandState
    let el = $$('div').addClass('sc-edit-link-tool')

    // GUARD: Return if tool is disabled
    if (commandState.disabled) {
      console.warn('Tried to render EditLinkTool while disabled.')
      return el
    }

    let urlPath = this.getUrlPath()

    el.append(
      $$(Input, {
        type: 'url',
        path: urlPath,
        placeholder: 'Paste or type a link url'
      }),
      $$(Button, {
        icon: 'open-link',
        theme: 'dark',
      }).attr('title', this.getLabel('open-link'))
        .on('click', this._openLink),

      $$(Button, {
        icon: 'delete',
        theme: 'dark',
      }).attr('title', this.getLabel('delete-link'))
        .on('click', this.onDelete)
    )
    return el
  }

  onDelete(e) {
    e.preventDefault();
    let nodeId = this.getNodeId()
    let sm = this.context.surfaceManager
    let surface = sm.getFocusedSurface()
    if (!surface) {
      console.warn('No focused surface. Stopping command execution.')
      return
    }
    let editorSession = this.context.editorSession
    editorSession.transaction(function(tx, args) {
      tx.delete(nodeId)
      return args
    })
  }
}

EditLinkTool.urlPropertyPath = ['url']

export default EditLinkTool
