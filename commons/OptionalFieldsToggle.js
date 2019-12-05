import { $$ } from '../dom'
import { Icon } from '../ui'

export default function OptionFieldToggle (props) {
  const { showOptionalFields } = props
  return $$('button', { class: 'sc-optional-fields-toggle' },
    $$(Icon, { icon: showOptionalFields ? 'chevron-up' : 'chevron-down' }),
    showOptionalFields ? 'Less fields' : 'More fields'
  )
}
