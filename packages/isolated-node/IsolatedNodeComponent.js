import startsWith from '../../util/startsWith'
import Coordinate from '../../model/Coordinate'
import Component from '../../ui/Component'
import AbstractIsolatedNodeComponent from '../../ui/AbstractIsolatedNodeComponent'

class IsolatedNodeComponent extends AbstractIsolatedNodeComponent {

  constructor(...args) {
    super(...args)
  }

  render($$) {
    let node = this.props.node
    let ContentClass = this.ContentClass
    // console.log('##### IsolatedNodeComponent.render()', $$.capturing);
    let el = $$('div')
    el.addClass(this.getClassNames())
      .addClass('sc-isolated-node')
      .addClass('sm-'+this.props.node.type)
      .attr("data-id", node.id)

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
      .on('keypress', this._stopPropagation)
      .on('keyup', this._stopPropagation)
      .on('compositionstart', this._stopPropagation)
      .on('textInput', this._stopPropagation)

    let level = this._getLevel()

    if (this.state.mode === 'cursor' && this.state.position === 'before') {
      el.append(
        $$('div').addClass('se-cursor').addClass('sm-before')
      )
    }
    el.append(
      this.renderContent($$, node).ref('content')
    )

    if (disabled) {
      el.addClass('sm-disabled')
        .attr('contenteditable', false)
        // ATTENTION: draggable=true causes trouble in Safari not to work at all
        // i.e. does not select anymore
        .attr('draggable', true)
        .on('mousedown', this._reserveMousedown, this)
        .on('click', this.onClick)
    } else {
      // ATTENTION: see above
      if (this.state.mode !== 'focused') {
        el.attr('draggable', true)
      }
      el.on('mousedown', this._reserveMousedown, this)
        .on('click', this.onClick)
    }

    if (this.state.mode === 'cursor' && this.state.position === 'after') {
      el.append(
        $$('div').addClass('se-cursor').addClass('sm-after')
      )
    }

    return el
  }

  getClassNames() {
    return ''
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
      if (sel.isContainerSelection() && sel.containsNodeFragment(nodeId)) {
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

  _selectNode() {
    // console.log('IsolatedNodeComponent: selecting node.');
    let editorSession = this.context.editorSession
    let surface = this.context.surface
    let nodeId = this.props.node.id
    editorSession.setSelection({
      type: 'node',
      nodeId: nodeId,
      mode: 'full',
      containerId: surface.getContainerId(),
      surfaceId: surface.id
    })
  }

  onClick(event) {
    if (this._mousedown) {
      this._mousedown = false
      event.preventDefault()
      event.stopPropagation()
      this._selectNode()
    }
  }

  // EXPERIMENTAL: Surface and IsolatedNodeComponent communicate via flag on the mousedown event
  // and only reacting on click or mouseup when the mousedown has been reserved
  _reserveMousedown(event) {
    if (event.__reserved__) {
      console.log('%s: mousedown already reserved by %s', this.id, event.__reserved__.id)
      return
    } else {
      console.log('%s: taking mousedown ', this.id)
      event.__reserved__ = this
      this._mousedown = true
    }
  }

  get id() { return this.getId() }
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
  return {
    start: {
      container: comp.el.getNativeElement(),
      offset: 0
    },
    end: {
      container: comp.el.getNativeElement(),
      offset: comp.el.getChildCount()
    }
  }
}

export default IsolatedNodeComponent
