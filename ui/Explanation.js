import { $$ } from '../dom'
import Icon from './Icon'

// Shows a question mark and a help message on hover
// TODO: in future we will probably want to render message in popover
export default function Explanation (props) {
  return $$('div', { class: 'sc-explanation', title: props.message },
    $$(Icon, { icon: 'question-circle' })
  )
}
