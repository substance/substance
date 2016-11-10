import DefaultDOMElement from './DefaultDOMElement'
import Component from './Component'
import EventEmitter from '../util/EventEmitter'

class DragManager extends EventEmitter {

  constructor(dndHandlers, context) {
    super()
    this.context = context
    this.dndHandlers = dndHandlers
    this._source = null
    this.el = DefaultDOMElement.wrapNativeElement(document)

    this.el.on('dragstart', this._onDragStart, this)
    this.el.on('dragend', this._onDragEnd, this)
    this.el.on('dragenter', this._onDragEnter, this)
    this.el.on('dragexit', this._onDragExit, this)
    this.el.on('dragover', this._onDragOver, this)
    this.el.on('drop', this._onDrop, this)
  }

  dispose() {
    this.el.off(this)
  }

  _onDragStart(e) { // eslint-disable-line
    // dito: trigger listeners to expose drop targets
    // console.log('DragManager.onDragStart', event, component);
    console.log(e)
    this._externalDrag = false
    this._initDrag(e)
  }

  _isMouseInsideDOMSelection(e) {
    let domSelection = window.getSelection()
    if (domSelection.rangeCount === 0) {
      return false
    }

    let domRange = domSelection.getRangeAt(0)
    let selectionRect = domRange.getBoundingClientRect()

    return e.clientX >= selectionRect.left &&
           e.clientX <= selectionRect.right &&
           e.clientY >= selectionRect.top &&
           e.clientY <= selectionRect.bottom;
  }

  _initDrag(e) {

    let dragState = { event: e }
    let isSelectionDrag = this._isMouseInsideDOMSelection(e)
    if (isSelectionDrag) {
      let sourceSelection = this.context.editorSession.getSelection()
      dragState.sourceSelection = sourceSelection
      if (sourceSelection.isPropertySelection()) {
        dragState.mode = 'inline'
      } else {
        dragState.mode = 'block'
      }
    } else {
      e.preventDefault()
      e.stopPropagation()
    }

    this.dragState = new DragState(dragState)

    e.dataTransfer.effectAllowed = 'all'
    e.dataTransfer.setData('text/html', e.target.outerHTML)

    var dragIcon = document.createElement('img')
    dragIcon.width = 30
    e.dataTransfer.setDragImage(dragIcon, -10, -10)
    // event.stopPropagation()

    this.emit('dragstart', this.dragState)
  }

  _onDragOver(e) {
    this._updateDrag(e)
  }

  _onDragEnter(e) {
    if (!this.dragState) {
      this._initDrag(e)
      this._externalDrag = true
    }
  }

  _updateDrag(e) {
    let targetEl = DefaultDOMElement.wrapNativeElement(e.target)
    // HACK: ignore drop teaser
    if (targetEl.is('.sc-drop-teaser')) return

    let components = this._getComponents(targetEl)
    let surface, nodeComponent

    // console.log('comps', components)

    if (components) {
      surface = components[0]
      if (surface && surface.isContainerEditor()) {
        nodeComponent = components[1]
      }
    }
    this.dragState.event = e
    this.dragState.surface = surface
    this.dragState.targetEl = nodeComponent ? nodeComponent.el : targetEl
    this.dragState.targetNodeId = nodeComponent ? nodeComponent.props.node.id : null

    // position the drop-teaser in case of a ContainerDrop
    if (this.dragState.mode === 'block') {
      let elRect = this.dragState.targetEl.getNativeElement().getBoundingClientRect()
      let mouseY = this.dragState.event.clientY
      let threshold = elRect.top + elRect.height / 2
      this.dragState.insertMode = mouseY > threshold ? 'after' : 'before'
      this.dragState.isContainerDrop = Boolean(nodeComponent)
      this.emit('drop-teaser:position-requested', this.dragState)
    }
  }

  _getComponents(targetEl) {
    let res = []
    let curr = targetEl
    while (curr) {
      let comp = Component.getComponentForDOMElement(curr)
      if (comp) {
        res.unshift(comp)
        if(comp._isSurface) {
          return res
        }
      }
      curr = curr.parentNode
    }
    return null
  }

  _onDragEnd() {
    if (this.dragState) {
      try {
        this.emit('drop-teaser:position-requested', Object.assign({}, this.dragState, { isContainerDrop: false }))
      } finally {
        this.dragState = null;
      }
    }
  }

  _onDragExit() {
    this._onDragEnd()
  }

  _onDrop(e) {
    console.log('DragManager.onDrop', e, this.dragState);
    let dragState = this.dragState
    e.preventDefault()
    e.stopPropagation()

    this._onDragEnd()

    let i, handler;
    for (i = 0; i < this.dndHandlers.length; i++) {
      handler = this.dndHandlers[i]

      let match = handler.match(dragState, this.context)
      if (match) {
        handler.drop(dragState, this.context)
        break
      }
    }

  }

  _getData(event) {
    let dataTransfer = event.dataTransfer
    if (dataTransfer) {
      return {
        types: dataTransfer.types,
        items: Array.prototype.slice.call(dataTransfer.items),
        files: Array.prototype.slice.call(dataTransfer.files)
      }
    }
  }
}


class DragState {

  constructor(data) {
    this.mode = data.mode
    this.targetEl = data.targetEl
    this.surfaceId = data.surfaceId
    this.sourceSelection = data.sourceSelection
    this.event = data.event
  }

}


function _getData(event) {
  let dataTransfer = event.dataTransfer
  if (dataTransfer) {
    return {
      types: dataTransfer.types,
      items: Array.prototype.slice.call(dataTransfer.items),
      files: Array.prototype.slice.call(dataTransfer.files)
    }
  }
}

function _getTargetInfo(event) {
  let target = {
    element: DefaultDOMElement.wrapNativeElement(event.target)
  }
  // try to get information about the component
  let comp = Component.getComponentFromNativeElement(event.target)
  comp = _getComponent(comp)
  if (comp) {
    target.comp = comp
    if (target._isSurface) {
      target.surface = comp
    } else if (comp.context.surface) {
      target.surface = comp.context.surface
    }
    if (target.surface) {
      let sel = target.surface.getSelectionFromEvent(event)
      if (sel) target.selection = sel
    }
    let node = comp.props.node
    if (node) target.node = node
    if (comp._isTextPropertyComponent) {
      target.path = comp.props.path
    }
  }
  return target
}

function _getComponent(comp) {
  if (comp._isTextNodeComponent || comp._isElementComponent) {
    return _getComponent(comp.getParent())
  }
  return comp;
}

export default DragManager
