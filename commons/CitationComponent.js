import { $$ } from '../dom'
import { Button, StackFill, HorizontalStack, Divider } from '../ui'
import { AnnotationComponent } from '../editor'
import PopoverMixin from './PopoverMixin'
import CitationModal from './CitationModal'

// NOTE: this should be an inline node component
export default class CitationComponent extends PopoverMixin(AnnotationComponent) {
  getActionHandlers () {
    return {
      edit: this._onEdit,
      delete: this._onDelete
    }
  }

  getPopoverComponent () {
    return _CitationPopover
  }

  render () {
    const node = this.props.node
    const el = super.render()
    el.addClass('sc-citation')

    if (node.target && node.target.length > 0) {
      const references = node.resolve('target')
      const refLabels = references.map(ref => ref.label)
      refLabels.sort()
      el.append(
        `[${refLabels.join(',')}]`
      )
    }

    return el
  }

  exposePopover (selectionState) {
    const { selection, annosByType } = selectionState
    if (selection && selection.isPropertySelection()) {
      const citations = annosByType.get('cite')
      if (citations && citations.length === 1 && citations[0] === this.props.node) {
        return selection.isInsideOf(this.props.node.getSelection())
      }
    }
    return false
  }

  _onDelete () {
    this.context.api.deleteNode(this.props.node.id)
  }

  _onEdit () {
    const { node } = this.props
    const { editorSession } = this.context
    const document = editorSession.getDocument()
    this.send('requestModal', () => {
      return $$(CitationModal, { document, node, mode: 'edit' })
    }).then(modal => {
      if (!modal) return
      const data = { target: modal.state.value }
      this.context.api.updateCitation(node.id, data)
    })
  }
}

function _CitationPopover (props) {
  const references = props.node.resolve('target')

  return $$('div', { class: 'sc-citation-popover' },
    ...references.map(ref => {
      return $$(HorizontalStack, { class: 'se-reference' },
        $$('div', { class: 'se-label' }, `[${ref.label}]`),
        $$('div', { class: 'se-content' }, ref.content)
      )
    }),
    $$(Divider),
    $$(HorizontalStack, {},
      $$('div', { class: 'se-label' }, 'Citation'),
      $$(StackFill),
      $$(Button, { action: 'delete', size: 'small', style: 'danger' }, 'Delete'),
      $$(Button, { action: 'edit', size: 'small', style: 'primary' }, 'Edit')
    )
  )
}
