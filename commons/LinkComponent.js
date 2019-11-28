import { $$ } from '../dom'
import { platform, getSelectionRect } from '../util'
import { Button, StackFill, HorizontalStack, Divider } from '../ui'
import { AnnotationComponent } from '../editor'
import LinkModal from './LinkModal'

// TODO: here a is a lot of shareable logic
// extract after this is working
export default class LinkComponent extends AnnotationComponent {
  getActionHandlers () {
    return {
      edit: this._onEdit,
      delete: this._onDelete
    }
  }

  didMount () {
    const editorState = this.context.editorState
    if (editorState) {
      editorState.addObserver(['selectionState'], this._onSelectionStateChange, this, { stage: 'position' })
    }
  }

  dispose () {
    const editorState = this.context.editorState
    if (editorState) {
      editorState.removeObserver(this)
    }
  }

  getTagName () {
    return 'a'
  }

  render () {
    const node = this.props.node
    const el = super.render()
    el.addClass('sc-external-link')
    el.attr('href', node.href)
    return el
  }

  _getDesiredPopoverPos () {
    if (platform.inBrowser) {
      const selectionRect = getSelectionRect({ top: 0, left: 0 })
      if (selectionRect) {
        let { left: x, top: y, height, width } = selectionRect
        y = y + height + 5
        x = x + width / 2
        return { x, y }
      }
    }
    return { x: 0, y: 0 }
  }

  _onDelete () {
    this.context.api.deleteNode(this.props.node.id)
  }

  _onEdit () {
    const node = this.props.node
    this.send('requestModal', () => {
      return $$(LinkModal, { node, mode: 'edit' })
    }).then(modal => {
      // Note: ModalCanvas returns false if modal has been cancelled,
      // otherwise the modal instance, so that we can take the data from the inputs
      if (!modal) return
      this._updateLink({
        href: modal.refs.href.val()
      })
    })
  }

  _updateLink (data) {
    const node = this.props.node
    const { href } = data
    if (href !== node.href) {
      this.context.api.updateNode(node.id, { href })
    }
  }

  _onSelectionStateChange (selectionState) {
    const oldShowPopup = this._showPopup
    let showPopup = false
    const { selection, annosByType } = selectionState
    if (selection && selection.isPropertySelection()) {
      // show only if there is exactly the one link under the selection
      // and the selection is completely inside of the link
      const links = annosByType.get('link')
      if (links && links.length === 1 && links[0] === this.props.node) {
        showPopup = selection.isInsideOf(this.props.node.getSelection())
      }
    }
    this._showPopup = showPopup
    if (!showPopup && oldShowPopup) {
      this.send('releasePopover', this)
    }
    // always update the request because of positioning
    if (showPopup) {
      const node = this.props.node
      this.send('requestPopover', {
        requester: this,
        desiredPos: this._getDesiredPopoverPos(),
        content: () => {
          return $$(_LinkPopover, { node })
        },
        position: 'relative'
      })
    }
  }
}

function _LinkPopover (props) {
  const href = props.node.href
  return $$('div', { class: 'sc-link-popover' },
    $$('div', { class: 'se-link' },
      href ? $$('a', { href, target: '_blank' }, href) : 'No link set'
    ),
    $$(Divider),
    $$(HorizontalStack, {},
      $$('div', { class: 'se-label' }, 'Link'),
      $$(StackFill),
      $$(Button, { action: 'delete', size: 'small', style: 'danger' }, 'Delete'),
      $$(Button, { action: 'edit', size: 'small', style: 'primary' }, 'Edit')
    )
  )
}
