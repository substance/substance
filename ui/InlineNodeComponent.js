import isEqual from '../util/isEqual'
import AbstractIsolatedNodeComponent from './AbstractIsolatedNodeComponent'
import Component from './Component'

class InlineNodeComponent extends AbstractIsolatedNodeComponent {
  render ($$) {
    const node = this.props.node
    const ContentClass = this.ContentClass
    const state = this.state

    let el = $$('span')
    el.addClass(this.getClassNames())
      .addClass('sc-inline-node')
      .addClass('sm-' + this.props.node.type)
      .attr('data-id', node.id)
      .attr('data-inline', '1')

    let disabled = this.isDisabled()

    if (state.mode) {
      el.addClass('sm-' + state.mode)
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

    // TODO: Chrome et al. does not display selections
    // for `draggable=true`
    // We should only enable draggable if the parent
    // surface is actually focused
    // However, there is some weird behavior:
    // rerendering with `draggable=false` does
    // not remove the attribute
    el.attr('draggable', true)

    return el
  }

  isDisabled () {
    return !this.state.mode || ['co-selected', 'cursor'].indexOf(this.state.mode) > -1
  }

  getClassNames () {
    return ''
  }

  onClick (event) {
    if (!this._shouldConsumeEvent(event)) {
      return
    }
    this.selectNode()
  }

  selectNode () {
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

  _getContentClass (node) {
    let ComponentClass
    // first try to get the component registered for this node
    ComponentClass = this.getComponent(node.type, true)
    // then try to find a generic a component registered
    // for "inline-node"
    if (!ComponentClass) {
      ComponentClass = this.getComponent('unsupported-inline-node', true)
    }
    if (!ComponentClass) {
      console.error(`No component registered for inline node '${node.type}'.`)
      ComponentClass = StubInlineNodeComponent
    }
    return ComponentClass
  }

  // TODO: this is almost the same as in InlineNodeComponent
  // We should try to consolidate this
  _deriveStateFromSelectionState (selState) {
    let surface = this._getSurface(selState)
    if (!surface) return null
    // detect cases where this node is selected or co-selected by inspecting the selection
    if (surface === this.context.surface) {
      let sel = selState.getSelection()
      let node = this.props.node
      if (sel.isPropertySelection() && !sel.isCollapsed() && isEqual(sel.start.path, node.start.path)) {
        let nodeSel = node.getSelection()
        if (nodeSel.equals(sel)) {
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

class StubInlineNodeComponent extends Component {
  render ($$) {
    const node = this.props.node
    return $$('span').text('???').attr('data-id', node.id).attr('data-type', node.type)
  }
}

export default InlineNodeComponent
