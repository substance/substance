import Component from '../../ui/Component'
import AbstractIsolatedNodeComponent from '../../ui/AbstractIsolatedNodeComponent'

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
class IsolatedNodeComponent extends AbstractIsolatedNodeComponent {

  constructor(...args) {
    super(...args)
  }

  render($$) {
    let node = this.props.node
    let ContentClass = this.ContentClass
    let disabled = this.props.disabled

    // console.log('##### IsolatedNodeComponent.render()', $$.capturing);
    let el = $$('div')
    el.addClass(this.getClassNames())
      .addClass('sc-isolated-node')
      .addClass('sm-'+this.props.node.type)
      .attr("data-id", node.id)
    if (disabled) {
      el.addClass('sm-disabled')
    }
    if (this.state.mode) {
      el.addClass('sm-'+this.state.mode)
    }
    if (!ContentClass.noStyle) {
      el.addClass('sm-default-style')
    }
    // always handle ESCAPE
    el.on('keydown', this.onKeydown)

    let shouldRenderBlocker = (this.blockingMode === 'closed') && (this.state.mode !== 'focused')

    let content = this.renderContent($$, node, {
      disabled: this.props.disabled || shouldRenderBlocker
    }).ref('content')
    content.attr('contenteditable', false)

    el.append(content)
    if (shouldRenderBlocker) {
      el.append($$(Blocker).ref('blocker'))
    }
    return el
  }

  getClassNames() {
    return ''
  }

  getContent() {
    return this.refs.content
  }

  _deriveStateFromSelectionState(selState) {
    let surface = this._getSurface(selState)
    if (!surface) return null
    // detect cases where this node is selected or co-selected by inspecting the selection
    if (surface === this.context.surface) {
      let sel = selState.getSelection()
      let nodeId = this.props.node.id
      if (sel.isNodeSelection() && sel.getNodeId() === nodeId) {
        if (sel.isFull()) {
          return { mode: 'selected' }
        } else if (sel.isBefore()) {
          return { mode: 'cursor', position: 'before' }
        } else if (sel.isAfter()) {
          return { mode: 'cursor', position: 'after' }
        }
      }
      if (sel.isContainerSelection() && sel.containsNode(nodeId)) {
        return { mode: 'co-selected' }
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

  selectNode() {
    // console.log('IsolatedNodeComponent: selecting node.');
    let editorSession = this.context.editorSession
    let surface = this.context.surface
    let nodeId = this.props.node.id
    editorSession.setSelection({
      type: 'node',
      nodeId: nodeId,
      containerId: surface.getContainerId(),
      surfaceId: surface.id
    })
  }

  grabFocus(event) {
    let content = this.refs.content
    if (content.grabFocus) {
      content.grabFocus(event)
    }
  }

  _fixForNavigation() {
    this.refs.content.el.removeAttribute('contenteditable')
  }

}

IsolatedNodeComponent.prototype._isIsolatedNodeComponent = true

IsolatedNodeComponent.prototype._isDisabled = IsolatedNodeComponent.prototype.isDisabled

IsolatedNodeComponent.getDOMCoordinate = function(comp, coor) {
  let { start, end } = IsolatedNodeComponent.getDOMCoordinates(comp)
  if (coor.offset === 0) return start
  else return end
}

IsolatedNodeComponent.getDOMCoordinates = function(comp) {
  let el = comp.el
  return {
    start: {
      container: el.getNativeElement(),
      offset: 0
    },
    end: {
      container: el.getNativeElement(),
      // offset: 1
      offset: el.getChildCount()
    }
  }
}

class Blocker extends Component {

  render($$) {
    return $$('div').addClass('sc-isolated-node-blocker')
      .attr('draggable', true)
      .attr('contenteditable', false)
      .on('mousedown', this._reserveMousedown, this)
      .on('click', this.onClick)
      .on('dblclick', this.onDblClick)
  }

  onClick(event) {
    if (event.target !== this.getNativeElement()) return
    console.log('Clicked on Blocker of %s', this._getIsolatedNodeComponent().id, event)
    if (this.state.mode !== 'selected' && this.state.mode !== 'focused') {
      event.preventDefault()
      event.stopPropagation()
      this._getIsolatedNodeComponent().selectNode()
    }
  }

  onDblClick(event) {
    console.log('DblClicked on Blocker of %s', this.getParent().id, event)
    // console.log('%s: onClick()', this.id, event)
    event.preventDefault()
    event.stopPropagation()
    this._getIsolatedNodeComponent().grabFocus(event)
  }

  _getIsolatedNodeComponent() {
    return this.context.isolatedNodeComponent
  }

  // EXPERIMENTAL: Surface and IsolatedNodeComponent communicate via flag on the mousedown event
  // and only reacting on click or mouseup when the mousedown has been reserved
  _reserveMousedown(event) {
    if (event.__reserved__) {
      // console.log('%s: mousedown already reserved by %s', this.id, event.__reserved__.id)
      return
    } else {
      // console.log('%s: taking mousedown ', this.id)
      event.__reserved__ = this
    }
  }

}

export default IsolatedNodeComponent
