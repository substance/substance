import { $$ } from '../dom'
import { Form, FormRow, Input, Modal, MultiSelect } from '../ui'

export default function AuthorModal (props) {
  let { document, node, mode } = props
  node = mode === 'create' ? { firstName: '', lastName: '', affiliations: [] } : node
  const title = mode === 'create' ? 'Create Author' : 'Edit Author'
  const confirmLabel = mode === 'edit' ? 'Update Author' : 'Create Author'

  // see if there are affiliations available
  const root = document.root
  const affiliations = root.resolve('affiliations')

  return $$(Modal, { title, cancelLabel: 'Cancel', confirmLabel, size: 'medium' },
    $$(Form, {},
      $$(FormRow, { label: 'First Name' },
        $$(Input, { autofocus: true, value: node.firstName || '' }).ref('firstName')
      ),
      $$(FormRow, { label: 'Last Name' },
        $$(Input, { value: node.lastName || '' }).ref('lastName')
      ),
      affiliations && affiliations.length > 0
        ? $$(FormRow, { label: 'Affiliations' },
          $$(MultiSelect, {
            options: affiliations.map(aff => {
              return { value: aff.id, label: aff.name }
            }),
            selected: node.affiliations,
            placeholder: 'Select an Affiliation'
          }).ref('affiliations')
        )
        : null
    )
  )
}
