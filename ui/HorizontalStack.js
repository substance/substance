import { $$ } from '../dom'

export default function HorizontalStack (props) {
  return $$('div', { className: 'sc-horizontal-stack' },
    ...props.children
  )
}
