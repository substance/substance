import { $$ } from '../dom'

export default function Limiter (props) {
  const className = 'sc-limiter ' + (props.fullscreen ? 'sm-fullscreen' : 'sm-default')
  return $$('div', { className },
    ...props.children
  )
}
