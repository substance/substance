import DefaultDOMElement from './DefaultDOMElement'
import Component from './Component'
import inBrowser from '../util/inBrowser'
import EventEmitter from '../util/EventEmitter'

import copySelection from '../model/transform/copySelection'
import deleteSelection from '../model/transform/deleteSelection'
import paste from '../model/transform/paste'
import NodeSelection from '../model/NodeSelection'

class DragManager extends EventEmitter {

  constructor(dndHandlers, context) {
    super()
    this.context = context
    this.dndHandlers = dndHandlers
    this._source = null

    if (inBrowser) {
      this.el = DefaultDOMElement.wrapNativeElement(document)
      this.el.on('dragstart', this._onDragStart, this)
      this.el.on('dragend', this._onDragEnd, this)
      this.el.on('dragenter', this._onDragEnter, this)
      this.el.on('dragexit', this._onDragExit, this)
      this.el.on('dragover', this._onDragOver, this)
      this.el.on('drop', this._onDrop, this)
    }
  }

  dispose() {
    if (this.el) {
      this.el.off(this)
    }
  }

  _onDragStart(e) { // eslint-disable-line
    // console.log('DragManager.onDragStart', event, component);
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

    let dragState = { event: e, mode: 'block' }

    let isSelectionDrag = this._isMouseInsideDOMSelection(e)
    if (isSelectionDrag) {
      let sourceSelection = this.context.editorSession.getSelection()
      dragState.sourceSelection = sourceSelection
      if (sourceSelection.isPropertySelection()) {
        dragState.mode = 'inline'
      }
    } else {
      // This is definitely hacky. Just until we have time to think about it
      // more thoroughly
      let comp = this._getIsolatedNodeOrContainerChild(DefaultDOMElement.wrapNativeElement(e.target))
      if (comp && comp.props.node) {
        let surface = comp.context.surface
        let nodeSelection = new NodeSelection({
          containerId: surface.getContainerId(),
          nodeId: comp.props.node.id,
          mode: 'full',
          surfaceId: surface.id
        })
        this.context.editorSession.setSelection(nodeSelection)
        dragState.sourceSelection = nodeSelection
      } else {
        e.preventDefault()
        e.stopPropagation()
      }
    }

    this.dragState = new DragState(dragState)

    e.dataTransfer.effectAllowed = 'all'
    e.dataTransfer.setData('text/html', e.target.outerHTML)

    var dragIcon = document.createElement('img')
    dragIcon.width = 30
    e.dataTransfer.setDragImage(dragIcon, -10, -10)

    this.emit('dragstart', this.dragState)
  }

  _onDragOver(e) {
    // console.log('_onDragOver', e)
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

  _getIsolatedNodeOrContainerChild(targetEl) {
    let parent, current
    current = targetEl
    parent = current.parentNode
    while(parent) {
      if (parent._comp && parent._comp._isContainerEditor) {
        return current._comp
      } else if (current._comp && current._comp._isIsolatedNode) {
        return current._comp
      }
      current = parent
      parent = current.parentNode
    }
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
    this.dragState.event = e
    this.dragState.data = this._getData(e)
    e.preventDefault()
    e.stopPropagation()
    if (this._externalDrag && this.dragState.data) {
      this._handleExternalDrop()
    } else if (this.dragState.sourceSelection) {
      this._handleInternalDrop()
    }
    this._onDragEnd()
  }

  _callHandlers(tx, params) {
    let i, handler;
    for (i = 0; i < this.dndHandlers.length; i++) {
      handler = this.dndHandlers[i]

      let match = handler.match(params, this.context)
      if (match) {
        handler.drop(tx, params, this.context)
        break
      }
    }
  }

  _handleExternalDrop() {
    let dragState = this.dragState
    let files = dragState.data.files
    let uris = dragState.data.uris
    let editorSession = this.context.editorSession

    editorSession.transaction((tx) => {
      if (dragState.isContainerDrop) {
        let containerId = dragState.surface.getContainerId()
        let nodeId = dragState.targetNodeId
        let insertMode = dragState.insertMode
        let surfaceId = dragState.surface.id
        tx.switchSurface(surfaceId)
        tx.selection = tx.createSelection({
          type: 'node',
          containerId: containerId,
          nodeId: nodeId,
          mode: insertMode
        })
      } else {
        console.error('Not yet supported')
        return
      }
      if (files.length > 0) {
        files.forEach((file) => {
          this._callHandlers(tx, {
            file: file,
            type: 'file'
          })
        })
      } else if (uris.length > 0) {
        uris.forEach((uri) => {
          this._callHandlers(tx, {
            uri: uri,
            type: 'uri'
          })
        })
      } else {
        console.info('TODO: implement html/text drop here')
      }
    })
  }

  _handleInternalDrop() {
    let context = this.context
    let dragState = this.dragState

    context.editorSession.transaction((tx) => {
      let copyResult = copySelection(tx, {selection: dragState.sourceSelection})
      deleteSelection(tx, {selection: dragState.sourceSelection, clear: true })
      if(dragState.isContainerDrop) {
        tx.switchSurface(dragState.surface.id)
        let containerId = dragState.surface.getContainerId()
        tx.selection = tx.createSelection({
          type: 'node',
          containerId: containerId,
          nodeId: dragState.targetNodeId,
          mode: dragState.insertMode
        })
        return paste(tx, {
          selection: tx.selection,
          doc: copyResult.doc,
          containerId: containerId
        })
      }
    })
  }

  /*
    Following best practice from Mozilla for URI extraction

    See: https://developer.mozilla.org/en-US/docs/Web/Guide/HTML/Recommended_Drag_Types#link
  */
  _extractUris(dataTransfer) {
    let uris = []
    let rawUriList = dataTransfer.getData('text/uri-list')
    if (rawUriList) {
      uris = rawUriList.split('\n').filter(function(item) {
        return !item.startsWith('#')
      })
    }
    return uris
  }

  /*
    Extracts information from e.dataTransfer (types, files, items)

    TODO: consider HTML
  */
  _getData(e) {
    let dataTransfer = e.dataTransfer
    if (dataTransfer) {
      return {
        uris: this._extractUris(dataTransfer),
        text: dataTransfer.getData('text/plain'),
        html: dataTransfer.getData('text/html'),
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

export default DragManager
