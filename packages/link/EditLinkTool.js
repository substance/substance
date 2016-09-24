import Tool from '../tools/Tool'
import clone from 'lodash/clone'

/**
  Tool to edit an existing link.

  Designed so that it can be used either in a toolbar, or within
  an overlay on the Surface.
*/
class EditLinkTool extends Tool {

  getUrlPath() {
    let propPath = this.constructor.urlPropertyPath
    return [this.props.node.id].concat(propPath)
  }

  _openLink() {
    console.log('open link...')
    let doc = this.context.documentSession.getDocument()
    window.open(doc.get(this.getUrlPath()), '_blank')
  }

  render($$) {
    let Prompt = this.getComponent('prompt')
    let Input = this.getComponent('input')
    let Button = this.getComponent('button')
    let node = this.props.node
    let doc = node.getDocument()
    let el = $$('div').addClass('sc-edit-link-tool')
    let urlPath = this.getUrlPath()

    el.append(
      $$(Input, {
        type: 'url',
        path: urlPath,
        placeholder: 'Paste or type a link url'
      }),
      $$(Button, {
        icon: 'open-link',
        style: this.props.style
      }).attr('title', this.getLabel('open-link'))
        .on('click', this._openLink),

      $$(Button, {
        icon: 'delete',
        style: this.props.style
      }).attr('title', this.getLabel('delete-link'))
        .on('click', this.onDelete)
    )
    return el
  }

  onDelete(e) {
    e.preventDefault();
    let node = this.props.node
    let sm = this.context.surfaceManager
    let surface = sm.getFocusedSurface()
    surface.transaction(function(tx, args) {
      tx.delete(node.id)
      return args
    })
  }
}

EditLinkTool.urlPropertyPath = ['url']

export default EditLinkTool
