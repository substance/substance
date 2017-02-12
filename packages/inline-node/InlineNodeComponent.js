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

    el.append(
      this.renderContent($$, node)
        .ref('content')
        .addClass('se-content')
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

  onClick(event) {
    if (!this._shouldConsumeEvent(event)) return
    this.selectNode()
  }

  selectNode() {
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

  // TODO: this is almost the same as in InlineNodeComponent
  // We should try to consolidate this
  _deriveStateFromSelectionState(selState) {
    let surface = this._getSurface(selState)
    if (!surface) return null
    // detect cases where this node is selected or co-selected by inspecting the selection
    if (surface === this.context.surface) {
      let sel = selState.getSelection()
      let node = this.props.node
      if (sel.isPropertySelection() && !sel.isCollapsed() && isEqual(sel.path, node.path)) {
        let nodeSel = node.getSelection()
        if(nodeSel.equals(sel)) {
          return { mode: 'selected' }
        }
        if (sel.contains(nodeSel)) {
          return { mode: 'co-selected' }
        }
      }
    }
    let isolatedNodeComponent = surface.context.isolatedNodeComponent
    if (!isolatedNodeComponent) return null
    if (isolatedNodeComponent === this) {
      return { mode: 'focused' }
    }
    let isolatedNodes = this._getIsolatedNodes(selState)
    if (isolatedNodes.indexOf(this) > -1) {
      return { mode: 'co-focused' }
    }
    return null
  }

}

InlineNodeComponent.prototype._isInlineNodeComponent = true

export default InlineNodeComponent
