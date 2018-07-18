import Coordinate from '../model/Coordinate'
import Component from './Component'
import AbstractIsolatedNodeComponent from './AbstractIsolatedNodeComponent'

const BRACKET = 'X'
const SLASH = '/'.charCodeAt(0)

/*
  Isolation Strategies:
    - default: IsolatedNode renders a blocker the content gets enabled by a double-click.
    - open: No blocker. Content is enabled when parent surface is.

    > Notes:

      The blocker is used to shield the inner UI and not to interfer with general editing gestures.
      In some cases however, e.g. a figure (with image and caption), it feels better if the content directly accessible.
      In this case, the content component must provide a means to drag the node, e.g. set `<img draggable=true>`.
      This works only in browsers that are able to deal with 'contenteditable' isles,
      i.e. a structure where the isolated node is contenteditable=false, and inner elements have contenteditable=true
      Does not work in Edge. Works in Chrome, Safari

      The the default unblocking gesture requires the content to implement a grabFocus() method, which should set the selection
      into one of the surfaces, or set a CustomSelection.
*/
export default class IsolatedNodeComponent extends AbstractIsolatedNodeComponent {
  render ($$) {
    const node = this.props.node
    const ContentClass = this.ContentClass
    const disabled = this.props.disabled

    // console.log('##### IsolatedNodeComponent.render()', $$.capturing);
    let el = $$('div')
    el.addClass(this.getClassNames())
      .addClass('sc-isolated-node')
      .addClass('sm-' + this.props.node.type)
      .attr('data-id', node.id)
    if (disabled) {
      el.addClass('sm-disabled')
    }
    if (this.state.mode) {
      el.addClass('sm-' + this.state.mode)
    }
    if (!ContentClass.noStyle) {
      el.addClass('sm-default-style')
    }
    // always handle ESCAPE
    el.on('keydown', this.onKeydown)

    // console.log('##### rendering IsolatedNode', this.id)
    const shouldRenderBlocker = (
      this.blockingMode === 'closed' &&
      !this.state.unblocked
    )

    // HACK: we need something 'editable' where we can put DOM selection into,
    // otherwise native cursor navigation gets broken
    el.append(
      $$('div').addClass('se-bracket sm-left').ref('left')
        .append(BRACKET)
    )

    let content = this.renderContent($$, node, {
      disabled: this.props.disabled || shouldRenderBlocker
    }).ref('content')
    content.attr('contenteditable', false)

    el.append(content)
    el.append($$(Blocker).ref('blocker'))
    el.append(
      $$('div').addClass('se-bracket sm-right').ref('right')
        .append(BRACKET)
    )

    if (!shouldRenderBlocker) {
      el.addClass('sm-no-blocker')
      el.on('click', this.onClick)
        .on('dblclick', this.onDblClick)
    }
    el.on('mousedown', this._reserveMousedown, this)

    return el
  }

  getClassNames () {
    return ''
  }

  getContent () {
    return this.refs.content
  }

  selectNode () {
    // console.log('IsolatedNodeComponent: selecting node.');
    const editorSession = this.getEditorSession()
    const surface = this.getParentSurface()
    const nodeId = this.props.node.id
    editorSession.setSelection({
      type: 'node',
      nodeId: nodeId,
      containerId: surface.getContainerId(),
      surfaceId: surface.id
    })
  }

  // EXPERIMENTAL: trying to catch clicks not handler by the
  // content when this is unblocked
  onClick (event) {
    // console.log('### Clicked on IsolatedNode', this.id, event.target)
    event.stopPropagation()
  }

  onDblClick (event) {
    // console.log('### DblClicked on IsolatedNode', this.id, event.target)
    event.stopPropagation()
  }

  grabFocus (event) {
    let content = this.refs.content
    if (content.grabFocus) {
      content.grabFocus(event)
      return true
    }
  }

  // EXPERIMENTAL: Surface and IsolatedNodeComponent communicate via flag on the mousedown event
  // and only reacting on click or mouseup when the mousedown has been reserved
  _reserveMousedown (event) {
    if (event.__reserved__) {
      // console.log('%s: mousedown already reserved by %s', this.id, event.__reserved__.id)

    } else {
      // console.log('%s: taking mousedown ', this.id)
      event.__reserved__ = this
    }
  }

  // TODO: this is almost the same as in IsolatedInlineNodeComponent
  // We should consolidate this
  _deriveStateFromSelectionState (selState) {
    const surface = this._getSurfaceForSelection(selState)
    const parentSurface = this.getParentSurface()
    let newState = { mode: null, unblocked: null }
    if (!surface) return newState
    // detect cases where this node is selected or co-selected by inspecting the selection
    if (surface === parentSurface) {
      let sel = selState.getSelection()
      let nodeId = this.props.node.id
      if (sel.isNodeSelection() && sel.getNodeId() === nodeId) {
        if (sel.isFull()) {
          newState.mode = 'selected'
          newState.unblocked = true
        } else if (sel.isBefore()) {
          newState.mode = 'cursor'
          newState.position = 'before'
        } else if (sel.isAfter()) {
          newState.mode = 'cursor'
          newState.position = 'after'
        }
      }
      if (sel.isContainerSelection() && sel.containsNode(nodeId)) {
        newState.mode = 'co-selected'
      }
    } else {
      let sel = selState.getSelection()
      let surfaceId = sel.surfaceId
      let id = this.getId()
      if (id.length < surfaceId.length && surfaceId.startsWith(id) && surfaceId.charCodeAt(id.length) === SLASH) {
        let tail = surfaceId.slice(id.length + 1)
        if (tail.indexOf('/') > 0) {
          newState.mode = 'co-focused'
          newState.unblocked = true
        } else {
          newState.mode = 'focused'
          newState.unblocked = true
        }
      }
    }
    return newState
  }

  get _isIsolatedNodeComponent () { return true }

  static getDOMCoordinate (comp, coor) {
    let { start, end } = IsolatedNodeComponent.getDOMCoordinates(comp)
    if (coor.offset === 0) return start
    else return end
  }

  static getDOMCoordinates (comp) {
    const left = comp.refs.left
    const right = comp.refs.right
    return {
      start: {
        container: left.getNativeElement(),
        offset: 0
      },
      end: {
        container: right.getNativeElement(),
        offset: right.getChildCount()
      }
    }
  }

  static getCoordinate (nodeEl, options) {
    let comp = Component.unwrap(nodeEl, 'strict').context.isolatedNodeComponent
    let offset = null
    if (options.direction === 'left' || nodeEl === comp.refs.left.el) {
      offset = 0
    } else if (options.direction === 'right' || nodeEl === comp.refs.right.el) {
      offset = 1
    }
    let coor
    if (offset !== null) {
      coor = new Coordinate([comp.props.node.id], offset)
      coor._comp = comp
    }
    return coor
  }
}

class Blocker extends Component {
  render ($$) {
    return $$('div').addClass('sc-isolated-node-blocker')
      .attr('draggable', true)
      .attr('contenteditable', false)
      .on('click', this.onClick)
      .on('dblclick', this.onDblClick)
  }

  onClick (event) {
    if (event.target !== this.getNativeElement()) return
    // console.log('Clicked on Blocker of %s', this._getIsolatedNodeComponent().id, event)
    event.stopPropagation()
    const comp = this._getIsolatedNodeComponent()
    comp.extendState({ mode: 'selected', unblocked: true })
    comp.selectNode()
  }

  onDblClick (event) {
    // console.log('DblClicked on Blocker of %s', this.getParent().id, event)
    event.stopPropagation()
  }

  _getIsolatedNodeComponent () {
    return this.context.isolatedNodeComponent
  }
}
