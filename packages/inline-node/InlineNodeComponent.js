import startsWith from '../../util/startsWith'
import isEqual from '../../util/isEqual'
import AbstractIsolatedNodeComponent from '../../ui/AbstractIsolatedNodeComponent'

class InlineNodeComponent extends AbstractIsolatedNodeComponent {

  render($$) {
    let node = this.props.node
    let ContentClass = this.ContentClass

    let el = $$('span')
    el.addClass(this.getClassNames())
      .addClass('sc-inline-node')
      .addClass('sm-'+this.props.node.type)
      .attr("data-id", node.id)
      .attr('data-inline', '1')

    let disabled = this.isDisabled()

    if (this.state.mode) {
      el.addClass('sm-'+this.state.mode)
    } else {
      el.addClass('sm-not-selected')
    }

    if (!ContentClass.noStyle) {
      el.addClass('sm-default-style')
    }

    // shadowing handlers of the parent surface
    // TODO: extract this into a helper so that we can reuse it anywhere where we want
    // to prevent propagation to the parent surface
    el.on('keydown', this.onKeydown)
      .on('mousedown', this._stopPropagation)
      .on('keypress', this._stopPropagation)
      .on('keyup', this._stopPropagation)
      .on('compositionstart', this._stopPropagation)
      .on('textInput', this._stopPropagation)

    let level = this._getLevel()

    el.append(
      this.renderContent($$, node)
        .ref('content')
        .addClass('se-content')
        .css({ 'z-index': level })
    )

    if (disabled) {
      el.addClass('sm-disabled')
         .attr('contenteditable', false)
         .on('click', this.onClick)
    }

    el.attr('draggable', true)
    return el
  }

  isDisabled() {
    return !this.state.mode || ['co-selected', 'cursor'].indexOf(this.state.mode) > -1;
  }

  getClassNames() {
    return ''
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
    let editorSession = this.context.editorSession
    let surface = this.context.surface
    let node = this.props.node
    editorSession.setSelection({
      type: 'property',
      path: node.start.path,
      startOffset: node.start.offset,
      endOffset: node.end.offset,
      containerId: surface.getContainerId(),
      surfaceId: surface.id
    })
  }

}

InlineNodeComponent.prototype._isInlineNodeComponent = true

export default InlineNodeComponent
