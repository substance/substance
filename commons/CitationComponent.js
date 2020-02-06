import { $$, Component } from '../dom'
import { Button, StackFill, HorizontalStack, Divider } from '../ui'
import PopoverMixin from './PopoverMixin'
import { getLabel } from './nodeHelpers'

export default class CitationComponent extends PopoverMixin(Component) {
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
    const el = $$('span').addClass('sc-citation').attr('data-id', node.id)

    const label = getLabel(node) || '???'
    el.append(label)

    return el
  }

  shouldShowPopover (selectionState) {
    const { selection, annosByType } = selectionState
    if (selection && selection.isPropertySelection()) {
      const citations = annosByType.get('cite')
      if (citations && citations.length === 1 && citations[0] === this.props.node) {
        return selection.isInsideOf(this.props.node.getSelection())
      }
    }
    return false
  }

  // TODO: this will not work until citation became an inline node
  _onDelete () {
    const { editorSession } = this.context
    const { node } = this.props
    editorSession.executeCommand('remove-citation', { node })
  }

  _onEdit () {
    const { editorSession } = this.context
    const { node } = this.props
    editorSession.executeCommand('edit-citation', { node })
  }
}

function _CitationPopover (props) {
  const references = props.node.resolve('references')

  return $$('div', { class: 'sc-citation-popover' },
    ...references.map(ref => {
      return $$(HorizontalStack, { class: 'se-reference' },
        $$('div', { class: 'se-label' }, `[${getLabel(ref)}]`),
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
