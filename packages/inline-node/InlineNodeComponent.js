import isEqual from 'lodash/isEqual'
import startsWith from 'lodash/startsWith'
import Coordinate from '../../model/Coordinate'
import IsolatedNodeComponent from '../isolated-node/IsolatedNodeComponent'

class InlineNodeComponent extends IsolatedNodeComponent {

  get _isInlineNodeComponent() {
    return true
  }

  // use spans everywhere
  get __elementTag() {
    return 'span'
  }

  get __slugChar() {
    return "\uFEFF"
  }

  getClassNames() {
    return 'sc-inline-node'
  }

  render($$) { // eslint-disable-line
    let el = super.render($$)
    el.attr('data-inline', '1')
    return el
  }

  // TODO: this is almost the same as the super method. Try to consolidate.
  _deriveStateFromSelectionState(selState) {
    let sel = selState.getSelection()
    let surfaceId = sel.surfaceId
    if (!surfaceId) return
    let id = this.getId()
    let node = this.props.node
    let parentId = this._getSurfaceParent().getId()
    let inParentSurface = (surfaceId === parentId)
    // detect cases where this node is selected or co-selected by inspecting the selection
    if (inParentSurface) {
      if (sel.isPropertySelection() && !sel.isCollapsed() && isEqual(sel.path, node.path)) {
        let nodeSel = node.getSelection()
        if(nodeSel.equals(sel)) {
          return { mode: 'selected' }
        }
        if (sel.contains(nodeSel)) {
          return { mode: 'co-selected' }
        }
      }
      return
    }
    // for all other cases (focused / co-focused) the surface id prefix must match
    if (!startsWith(surfaceId, id)) return
    // Note: trying to distinguisd focused
    // surfaceIds are a sequence of names joined with '/'
    // a surface inside this node will have a path with length+1.
    // a custom selection might just use the id of this IsolatedNode
    let p1 = id.split('/')
    let p2 = surfaceId.split('/')
    if (p2.length >= p1.length && p2.length <= p1.length+1) {
      return { mode: 'focused' }
    } else {
      return { mode: 'co-focused' }
    }
  }

  _selectNode() {
    // console.log('IsolatedNodeComponent: selecting node.');
    let surface = this.context.surface
    let doc = surface.getDocument()
    let node = this.props.node
    surface.setSelection(doc.createSelection({
      type: 'property',
      path: node.path,
      startOffset: node.startOffset,
      endOffset: node.endOffset
    }))
  }

}

InlineNodeComponent.getCoordinate = function(el) {
  // special treatment for block-level isolated-nodes
  let parent = el.getParent()
  if (el.isTextNode() && parent.is('.se-slug')) {
    let slug = parent
    let nodeEl = slug.getParent()
    if (nodeEl.is('.sc-inline-node')) {
      let startOffset = Number(nodeEl.getAttribute('data-offset'))
      let len = Number(nodeEl.getAttribute('data-length'))
      let charPos = startOffset
      if (slug.is('sm-after')) charPos += len
      let path
      while ( (nodeEl = nodeEl.getParent()) ) {
        let pathStr = nodeEl.getAttribute('data-path')
        if (pathStr) {
          path = pathStr.split('.')
          let coor = new Coordinate(path, charPos)
          coor.__inInlineNode__ = true
          coor.__startOffset__ = startOffset
          coor.__endOffset__ = startOffset+len
          return coor
        }
      }
    }
  }
  return null
}

export default InlineNodeComponent
