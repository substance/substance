import { $$ } from '../dom'

export default function Link (props) {
  const el = $$('a').addClass('sc-link')
  const style = props.style
  if (style) {
    el.addClass('sm-style-' + style)
  }
  const children = props.children
  const attributes = Object.assign({}, props)
  delete attributes.children
  el.attr(attributes)
  el.append(children)
  return el
}
