import { $$ } from '../dom'
import { Form, FormRow, Input, Modal } from '../ui'

export default function AffiliationModal (props) {
  let { node, mode } = props
  node = mode === 'create' ? { name: '' } : node
  const confirmLabel = mode === 'edit' ? 'Update Affiliation' : 'Create Affiliation'
  return $$(Modal, { cancelLabel: 'Cancel', confirmLabel, size: 'medium' },
    $$(Form, {},
      $$(FormRow, { label: 'Name' },
        $$(Input, { autofocus: true, value: node.name || '' }).ref('name')
      )
    )
  )
}
