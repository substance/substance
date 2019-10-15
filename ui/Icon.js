import { $$ } from '../dom'

export default function Icon (props) {
  const icon = props.icon
  return (
    $$('i').addClass('fas').addClass('fa-' + icon)
  )
}
