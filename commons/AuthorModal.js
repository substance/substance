import { $$ } from '../dom'
import { Form, FormRow, Input, Modal } from '../ui'

export default function AuthorModal (props) {
  let { node, mode } = props
  node = mode === 'create' ? { firstName: '', lastName: '' } : node
  const confirmLabel = mode === 'edit' ? 'Update Author' : 'Create Author'
  return $$(Modal, { cancelLabel: 'Cancel', confirmLabel, size: 'small' },
    $$(Form, {},
      $$(FormRow, { label: 'First Name' },
        $$(Input, { autofocus: true, value: node.firstName || '' }).ref('firstName')
      ),
      $$(FormRow, { label: 'Last Name' },
        $$(Input, { value: node.lastName || '' }).ref('lastName')
      )
    )
  )
}
