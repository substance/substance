import { Component, $$ } from '../dom'
import Button from './Button'
import Icon from './Icon'
import HorizontalStack from './HorizontalStack'
import Title from './Title'
import Divider from './Divider'

export default class Modal extends Component {
  render () {
    const { title, children, disableConfirm } = this.props
    const confirmLabel = this.props.confirmLabel || 'OK'
    const cancelLabel = this.props.cancelLabel || 'Cancel'
    const size = this.props.size || 'default'

    const headerEl = $$('div', { class: 'se-modal-header' },
      $$(HorizontalStack, {},
        $$(Title, {}, title),
        $$(Button, { size: 'large', style: 'plain', action: 'cancel' },
          $$(Icon, { icon: 'times' })
        )
      )
    )

    return $$('div', { class: `sc-modal sm-size-${size}` },
      $$('div', { class: 'se-modal-dialog' },
        title ? headerEl : null,
        $$('div', { class: 'se-modal-body' }, children),
        $$(Divider),
        $$('div', { class: 'se-modal-footer' },
          $$(HorizontalStack, {},
            $$(Button, { size: 'default', style: 'secondary', action: 'cancel' }, cancelLabel),
            $$(Button, { size: 'default', style: 'primary', action: 'confirm', disabled: disableConfirm }, confirmLabel)
          )
        )
      )
    )
  }
}
