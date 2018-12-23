import isEqual from '../util/isEqual'
import AbstractIsolatedNodeComponent from './AbstractIsolatedNodeComponent'
import Component from './Component'

// TODO: rename it to IsolatedInlineNodeComponent
// The thing is that InlineNodeComponent as a general implementation is
// actually an IsolatedNodeComponent, but the current naming does not reveal that.
export default class IsolatedInlineNodeComponent extends AbstractIsolatedNodeComponent {
  render ($$) {
    const model = this.props.model
    const ContentClass = this.ContentClass
    const state = this.state

    let el = $$('span')
    el.addClass(this.getClassNames())
      .addClass('sc-inline-node')
      .addClass('sm-' + this.props.model.type)
      .attr('data-id', model.id)
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
      this.renderContent($$, model)
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
    // TODO: instead of doing this directly here
    // we should delegate this to an API method (e.g. in editorSession)
    // console.log('IsolatedNodeComponent: selecting node.');
    const editorSession = this.getEditorSession()
    editorSession.setSelection(this._createNodeSelection())
  }

  _createNodeSelection () {
    const surface = this.getParentSurface()
    const model = this.props.model
    return {
      type: 'property',
      path: model.start.path,
      startOffset: model.start.offset,
      endOffset: model.end.offset,
      containerPath: surface.getContainerPath(),
      surfaceId: surface.id
    }
  }

  _getContentClass () {
    const model = this.props.model
    let ComponentClass
    // first try to get the component registered for this node
    ComponentClass = this.getComponent(model.type, true)
    // then try to find a generic a component registered
    // for "inline-node"
    if (!ComponentClass) {
      ComponentClass = this.getComponent('unsupported-inline-node', true)
    }
    // TODO: this should not be in substance
    // instead an application should register a custom implementation
    // overriding _getContentClass()
    if (!ComponentClass) {
      console.error(`No component registered for inline node '${model.type}'.`)
      ComponentClass = StubInlineNodeComponent
    }
    return ComponentClass
  }

  // TODO: this is almost the same as in IsolatedNodeComponent.
  _deriveStateFromSelectionState (sel, selState) {
    const surface = this._getSurfaceForSelection(sel, selState)
    const parentSurface = this.getParentSurface()
    if (!surface) return null
    // detect cases where this node is selected or co-selected by inspecting the selection
    if (surface === parentSurface) {
      const model = this.props.model
      if (sel.isPropertySelection() && !sel.isCollapsed() && isEqual(sel.start.path, model.start.path)) {
        const nodeSel = this.getDocument().createSelection(this._createNodeSelection())
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
    const model = this.props.model
    return $$('span').text('???').attr('data-id', model.id).attr('data-type', model.type)
  }
}
