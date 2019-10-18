import { $$ } from '../dom'

/* Just a little layout component for forms */
export default function Form (props) {
  return (
    $$('div', { className: 'sc-form' },
      props.children
    )
  )
}
