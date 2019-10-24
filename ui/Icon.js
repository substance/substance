import { $$ } from '../dom'

const STYLES = {
  regular: 'far',
  solid: 'fas'
}

export default function Icon (props) {
  const icon = props.icon
  const fstyle = STYLES[props.style] || 'fa'
  return $$('i').addClass(fstyle).addClass('fa-' + icon)
}
