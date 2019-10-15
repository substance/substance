import { $$ } from '../dom'
import getComponentForNode from './_getComponentForNode'

export default function _renderNode (comp, node, props = {}) {
  const NodeComponent = getComponentForNode(comp, node)
  props = Object.assign({
    disabled: comp.props.disabled,
    node
  }, props)
  return $$(NodeComponent, props)
}
