import { Component, $$ } from '../dom'
import { keys, parseKeyEvent } from '../util'
import Button from './Button'
import Icon from './Icon'
import HorizontalStack from './HorizontalStack'
import Title from './Title'
import Divider from './Divider'

export default class Modal extends Component {
  didMount () {
    const globalEventHandler = this.context.globalEventHandler
    if (globalEventHandler) {
      globalEventHandler.addEventListener('keydown', this._onKeydown, this)
    }
  }

  dispose () {
    const globalEventHandler = this.context.globalEventHandler
    if (globalEventHandler) {
      globalEventHandler.removeEventListener(this)
    }
  }

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

  _onKeydown (event) {
    event.stopPropagation()
    switch (event.keyCode) {
      case keys.ESCAPE: {
        this.send('cancel')
        break
      }
      case keys.ENTER: {
        const combo = parseKeyEvent(event, true)
        if (combo === 'META' || combo === 'ALT') {
          this.send('confirm')
        }
        break
      }
      default:
        //
    }
  }
}
