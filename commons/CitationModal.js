import { $$ } from '../dom'
import { Form, FormRow, Modal, MultiSelect } from '../ui'

export default function CitationModal (props) {
  const { document, node, mode } = props
  const confirmLabel = mode === 'edit' ? 'Update' : 'Create'
  const title = mode === 'edit' ? 'Edit Citation' : 'Create Citation'
  const value = mode === 'edit' ? node.target : []

  const root = document.root
  const referencesList = root.resolve('references')

  const modalProps = { title, cancelLabel: 'Cancel', confirmLabel, size: 'large' }
  return $$(Modal, modalProps,
    $$(Form, {},
      $$(FormRow, {},
        $$(MultiSelect, {
          options: referencesList.map(ref => {
            return { value: ref.id, label: ref.content }
          }),
          value,
          label: 'Add Reference',
          placeholder: 'Please select one or more references'
        }).ref('references')
      )
    )
  )
}
