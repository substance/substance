import { $$ } from '../dom'
import { Button, StackFill, HorizontalStack, Divider } from '../ui'
import { AnnotationComponent } from '../editor'
import PopoverMixin from './PopoverMixin'
import LinkModal from './LinkModal'

export default class LinkComponent extends PopoverMixin(AnnotationComponent) {
  getActionHandlers () {
    return {
      edit: this._onEdit,
      delete: this._onDelete
    }
  }

  getTagName () {
    return 'a'
  }

  getPopoverComponent () {
    return _LinkPopover
  }

  render () {
    const node = this.props.node
    const el = super.render()
    el.addClass('sc-external-link')
    el.attr('href', node.href)
    return el
  }

  exposePopover (selectionState) {
    const { selection, annosByType } = selectionState
    if (selection && selection.isPropertySelection()) {
      // show only if there is exactly the one link under the selection
      // and the selection is completely inside of the link
      const links = annosByType.get('link')
      if (links && links.length === 1 && links[0] === this.props.node) {
        return selection.isInsideOf(this.props.node.getSelection())
      }
    }
    return false
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
