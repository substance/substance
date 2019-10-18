import { $$ } from '../dom'
import { Form, FormRow, Input, Modal } from '../ui'

export default function LinkModal (props) {
  const { node, mode } = props
  const confirmLabel = mode === 'edit' ? 'Update Link' : 'Create Link'
  const value = mode === 'edit' ? node.href : ''
  const modalProps = { cancelLabel: 'Cancel', confirmLabel, size: 'small' }
  return $$(Modal, modalProps,
    $$(Form, {},
      $$(FormRow, { label: 'Link URL' },
        $$(Input, { autofocus: true, value }).ref('href')
      )
    )
  )
}
