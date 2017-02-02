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
      .on('mousedown', this._stopPropagation)
      .on('keypress', this._stopPropagation)
      .on('keyup', this._stopPropagation)
      .on('compositionstart', this._stopPropagation)
      .on('textInput', this._stopPropagation)

    el.append(
      $$('div').addClass('se-slug').addClass('sm-before').ref('before')
        // NOTE: better use a regular character otherwise Edge has problems
        .append('[')
    )

    let level = this._getLevel()

    let container = $$('div').addClass('se-container')
      .attr('contenteditable', false)
      .css({ 'z-index': 2*level })

    if (ContentClass.fullWidth) {
      container.addClass('sm-full-width')
    }

    if (this.state.mode === 'cursor' && this.state.position === 'before') {
      container.append(
        $$('div').addClass('se-cursor').addClass('sm-before').attr('contenteditable', false)
      )
    }
    container.append(
      this.renderContent($$, node).ref('content')
    )

    if (disabled) {
      container.addClass('sm-disabled')
      if (this.shouldRenderBlocker()) {
        // NOTE: there are some content implementations which work better without a blocker
        let blocker = $$('div').addClass('se-blocker').ref('blocker')
          .css({ 'z-index': 2*level+1 })
        // select the node on click
        blocker.on('click', this.onClickBlocker)
        container.append(blocker)
      } else {
        // select the node on click
        el.on('click', this.onClick)
      }
    }

    if (this.state.mode === 'cursor' && this.state.position === 'after') {
      container.append(
        $$('div').addClass('se-cursor').addClass('sm-after').attr('contenteditable', false)
      );
    }

    el.append(container)
    el.append(
      $$('div').addClass('se-slug').addClass('sm-after').ref('after')
        // NOTE: better use a regular character otherwise Edge has problems
        .append(']')
    )

    el.attr('draggable', true)
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
}

IsolatedNodeComponent.prototype._isIsolatedNodeComponent = true

IsolatedNodeComponent.prototype._isDisabled = IsolatedNodeComponent.prototype.isDisabled

/*
  This provides a model coordinatae for
*/
IsolatedNodeComponent.getCoordinate = function(node) {
  let parent = node.getParent()
  if (node.isTextNode() && parent.is('.se-slug')) {
    let slug = parent
    let isolatedNodeEl = slug.getParent()
    let comp = Component.unwrap(isolatedNodeEl)
    let nodeId = comp.props.node.id
    let charPos = slug.is('sm-after') ? 1 : 0
    let coor = new Coordinate([nodeId], charPos)
    coor._comp = comp
    coor.__inIsolatedBlockNode__ = true
    return coor
  } else {
    return null
  }
}

IsolatedNodeComponent.getDOMCoordinate = function(comp, coor) {
  let domCoor
  if (coor.offset === 0) {
    domCoor = {
      container: comp.refs.before.getNativeElement(),
      offset: 0
    }
  } else {
    domCoor = {
      container: comp.refs.after.getNativeElement(),
      offset: 1
    }
  }
  return domCoor
}

IsolatedNodeComponent.getDOMCoordinates = function(comp) {
  return {
    start: {
      container: comp.refs.before.getNativeElement(),
      offset: 0
    },
    end: {
      container: comp.refs.after.getNativeElement(),
      offset: 1
    }
  }
}

export default IsolatedNodeComponent
