import { $$ } from '../dom'

export default function Link (props) {
  const el = $$('a').addClass('sc-link')
  const { style, inlineBlock, inverted } = props
  if (style) {
    el.addClass('sm-style-' + style)
  }
  if (inlineBlock) {
    el.addClass('sm-inline-block')
  }
  if (inverted) {
    el.addClass('sm-inverted')
  }
  const children = props.children
  const attributes = Object.assign({}, props)
  // TODO: can we do this more elegantly?
  delete attributes.style
  delete attributes.inverted
  delete attributes.inlineBlock
  delete attributes.children
  el.attr(attributes)
  el.append(children)
  return el
}
