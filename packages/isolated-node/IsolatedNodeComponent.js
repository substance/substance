import startsWith from '../../util/startsWith'
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

    this.blockingMode = this.ContentClass.noBlocker ? 'open' : 'closed'
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

    let contentProps = {}
    switch (this.blockingMode) {
      case 'closed': {
        // the blocker is rendered unless an inner surface has the focus
        if (this.state.mode !== 'focused') {
          el.attr('contenteditable', false)
          el.append($$(Blocker).ref('blocker'))
          contentProps.disabled = true
        }
        break
      }
      case 'open': {
        el.attr('contenteditable', false)
        break
      }
      default:
        //
    }
    let content = this.renderContent($$, node, contentProps).ref('content')
    el.append(content)

    return el
  }

  getClassNames() {
    return ''
  }

  getContent() {
    return this.refs.content
  }

  _deriveStateFromSelectionState(selState) {
    let sel = selState.getSelection()
    let surfaceId = sel.surfaceId
    if (!surfaceId) return
    let id = this.getId()
    let nodeId = this.props.node.id
    let parentId = this._getSurfaceParent().getId()
    let inParentSurface = (surfaceId === parentId)
    // detect cases where this node is selected or co-selected by inspecting the selection
    if (inParentSurface) {
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
      return
    }
    if (sel.isCustomSelection() && id === surfaceId) {
      return { mode: 'focused' }
    }
    // HACK: a looks a bit hacky. Fine for now.
    // TODO: we should think about switching to surfacePath, instead of surfaceId
    else if (startsWith(surfaceId, id)) {
      let path1 = id.split('/')
      let path2 = surfaceId.split('/')
      let len1 = path1.length
      let len2 = path2.length
      if (len2 > len1 && path1[len1-1] === path2[len1-1]) {
        if (len2 === len1 + 1) {
          return { mode: 'focused' }
        } else {
          return { mode: 'co-focused' }
        }
      } else {
        return null
      }
    }
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

  grabFocus() {
    let content = this.refs.content
    if (content.grabFocus) {
      content.grabFocus()
    }
  }

}

IsolatedNodeComponent.prototype._isIsolatedNodeComponent = true

IsolatedNodeComponent.prototype._isDisabled = IsolatedNodeComponent.prototype.isDisabled

IsolatedNodeComponent.getDOMCoordinate = function(comp, coor) {
  let domCoor
  if (coor.offset === 0) {
    domCoor = {
      container: comp.el.getNativeElement(),
      offset: 0
    }
  } else {
    domCoor = {
      container: comp.el.getNativeElement(),
      offset: 1
    }
  }
  return domCoor
}

IsolatedNodeComponent.getDOMCoordinates = function(comp) {
  let el = comp.el
  let parent = el.parentNode
  let childIdx = parent.getChildIndex(el)
  return {
    start: {
      container: parent.getNativeElement(),
      offset: childIdx
    },
    end: {
      container: parent.getNativeElement(),
      offset: childIdx+1
    }
  }
}

class Blocker extends Component {

  render($$) {
    return $$('div').addClass('se-blocker')
      .attr('draggable', true)
      .attr('contenteditable', false)
      .on('mousedown', this._reserveMousedown, this)
      .on('click', this.onClick)
      .on('dblclick', this.onDblClick)
  }

  onClick(event) {
    if (event.target !== this.getNativeElement()) return
    console.log('Clicked on Blocker of %s', this.getParent().id, event)
    if (this.state.mode !== 'selected' && this.state.mode !== 'focused') {
      event.preventDefault()
      event.stopPropagation()
      this.getParent().selectNode()
    }
  }

  onDblClick(event) {
    console.log('DblClicked on Blocker of %s', this.getParent().id, event)
    // console.log('%s: onClick()', this.id, event)
    event.preventDefault()
    event.stopPropagation()
    this.getParent().grabFocus()
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
