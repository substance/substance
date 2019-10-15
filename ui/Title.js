import { $$ } from '../dom'

export default function Title (props) {
  const el = $$('div', { class: 'sc-title' },
    props.children
  )
  if (props.ellipsis) {
    el.addClass('sm-ellipsis')
  }
  return el
}
