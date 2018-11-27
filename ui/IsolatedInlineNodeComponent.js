import isEqual from '../util/isEqual'
import AbstractIsolatedNodeComponent from './AbstractIsolatedNodeComponent'
import Component from './Component'

// TODO: rename it to IsolatedInlineNodeComponent
// The thing is that InlineNodeComponent as a general implementation is
// actually an IsolatedNodeComponent, but the current naming does not reveal that.
export default class IsolatedInlineNodeComponent extends AbstractIsolatedNodeComponent {
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
    if (this._shouldConsumeEvent(event)) {
      event.stopPropagation()
      event.preventDefault()
      this.selectNode()
    }
  }

  selectNode () {
    // console.log('IsolatedNodeComponent: selecting node.');
    const editorSession = this.getEditorSession()
    const surface = this.getParentSurface()
    const node = this.props.node
    editorSession.setSelection({
      type: 'property',
      path: node.start.path,
      startOffset: node.start.offset,
      endOffset: node.end.offset,
      containerId: surface.getContainerId(),
      surfaceId: surface.id
    })
  }

  _getContentClass () {
    const node = this.props.node
    let ComponentClass
    // first try to get the component registered for this node
    ComponentClass = this.getComponent(node.type, true)
    // then try to find a generic a component registered
    // for "inline-node"
    if (!ComponentClass) {
      ComponentClass = this.getComponent('unsupported-inline-node', true)
    }
    // TODO: this should not be in substance
    // instead an application should register a custom implementation
    // overriding _getContentClass()
    if (!ComponentClass) {
      console.error(`No component registered for inline node '${node.type}'.`)
      ComponentClass = StubInlineNodeComponent
    }
    return ComponentClass
  }

  // TODO: this is almost the same as in IsolatedNodeComponent
  // We should consolidate this
  _deriveStateFromSelectionState (sel, selState) {
    const surface = this._getSurfaceForSelection(sel, selState)
    const parentSurface = this.getParentSurface()
    if (!surface) return null
    // detect cases where this node is selected or co-selected by inspecting the selection
    if (surface === parentSurface) {
      const node = this.props.node
      if (sel.isPropertySelection() && !sel.isCollapsed() && isEqual(sel.start.path, node.start.path)) {
        const nodeSel = node.getSelection()
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
    let isolatedNodes = this._getIsolatedNodes(sel, selState)
    if (isolatedNodes.indexOf(this) > -1) {
      return { mode: 'co-focused' }
    }
    return null
  }

  get _isInlineNodeComponent () { return true }
}

class StubInlineNodeComponent extends Component {
  render ($$) {
    const node = this.props.node
    return $$('span').text('???').attr('data-id', node.id).attr('data-type', node.type)
  }
}
