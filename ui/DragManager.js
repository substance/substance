import NodeSelection from '../model/NodeSelection'
import Component from '../ui/Component'
import DragAndDropHandler from '../ui/DragAndDropHandler'
import DefaultDOMElement from '../dom/DefaultDOMElement'
import EventEmitter from '../util/EventEmitter'
import inBrowser from '../util/inBrowser'

class DragManager extends EventEmitter {

  constructor(assetHandlers, context) {
    super()
    this.context = context
    this.assetHandlers = assetHandlers

    // TODO: This could live in the configurator at some point
    this.dropHandlers = [
      new MoveNode(),
      new InsertNodes(this.assetHandlers),
      new CustomHandler()
    ]
    this._source = null

    if (inBrowser) {
      this.el = DefaultDOMElement.wrapNativeElement(document)
      this.el.on('dragstart', this._onDragStart, this)
      this.el.on('dragend', this._onDragEnd, this)
      this.el.on('dragenter', this._onDragEnter, this)
      this.el.on('dragexit', this._onDragExit, this)
      this.el.on('dragover', this._onDragOver, this)
    }
  }

  dispose() {
    if (this.el) {
      this.el.off(this)
    }
  }

  _onDragStart(e) {
    // console.log('#### DragManager._onDragStart')
    this._initDrag(e, { external: false })
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

  /*
    Initializes dragState, which encapsulate state through the whole
    drag + drop operation.

    ATTENTION: This can not be debugged properly in Chrome
  */
  _initDrag(e, options) {
    console.log('_initDrag')
    let dragState = Object.assign({}, { event: e, mode: 'block'}, options)
    let isSelectionDrag = this._isMouseInsideDOMSelection(e)
    if (isSelectionDrag) {
      let sourceSelection = this.context.editorSession.getSelection()
      dragState.sourceSelection = sourceSelection
      if (sourceSelection.isPropertySelection()) {
        dragState.mode = 'inline'
      }
    } else {
      // We need to determine all ContainerEditors and their scrollPanes; those have the drop
      // zones attached
      let surfaces = Object.keys(this.context.surfaceManager.surfaces).map((surfaceId) => {
        return this.context.surfaceManager.surfaces[surfaceId]
      })

      let scrollPanes = {}
      surfaces.forEach((surface) => {
        // Skip for everything but container editors
        if (!surface.isContainerEditor()) return
        let scrollPane = surface.context.scrollPane
        let scrollPaneName = scrollPane.getName()
        let surfaceName = surface.getName()

        if (!scrollPanes[scrollPaneName]) {
          let surfaces = {}
          surfaces[surfaceName] = surface
          scrollPanes[scrollPaneName] = {
            scrollPane,
            surfaces
          }
        } else {
          scrollPanes[scrollPaneName].surfaces[surfaceName] = surface
        }
      })

      // We store the scrollPanes in dragState so the Dropzones component
      // can use it to compute dropzones per scrollpane for each contained
      // surface
      dragState.scrollPanes = scrollPanes


      // let surface = surfaces.find((surface) => { return surface.isContainerEditor() })
      // console.log('le surface', surface)

      // TODO: Compute dropzones for multiple surfaces (container editors)
      // In an internal drag, we receive the source (= node being dragged)
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

    this.dragState = dragState
    e.dataTransfer.effectAllowed = 'all'
    e.dataTransfer.setData('text/html', e.target.outerHTML)

    // Ensure we have a small dragIcon, so dragged content does not eat up
    // all screen space.
    var dragIcon = document.createElement('img')
    dragIcon.width = 30
    e.dataTransfer.setDragImage(dragIcon, -10, -10)
    this.emit('dragstart', this.dragState)
  }

  _onDragOver(/*e*/) {
    // console.log('_onDragOver', e)
    // this._updateDrag(e)
  }

  _onDragEnter(e) {
    // console.log('_onDragEnter(e)', e)
    if (!this.dragState) {
      this._initDrag(e, {external: true})
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
    // console.log('_onDragEnd')
    this.dragState = null
    this.emit('dragend')
  }

  _onDragExit() {
    // console.log('_onDragExit')
    this._onDragEnd()
  }

  handleDrop(e, dragStateExtensions) {
    let dragState = Object.assign(this.dragState, dragStateExtensions)
    console.log('le dragstate', dragState)

    let i, handler
    let match = false

    e.preventDefault()
    e.stopPropagation()

    dragState.event = e
    dragState.data = this._getData(e)

    // Run through drop handlers and call the first that matches
    for (i = 0; i < this.dropHandlers.length && !match; i++) {
      handler = this.dropHandlers[i]
      match = handler.match(dragState)
    }

    if (match) {
      let editorSession = this.context.editorSession
      editorSession.transaction((tx) => {
        handler.drop(tx, dragState)
      })
    } else {
      console.error('No drop handler could be found.')
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
    Extracts information from e.dataTransfer (files, uris, text, html)
  */
  _getData(e) {
    let dataTransfer = e.dataTransfer
    if (dataTransfer) {
      return {
        files: Array.prototype.slice.call(dataTransfer.files),
        uris: this._extractUris(dataTransfer),
        text: dataTransfer.getData('text/plain'),
        html: dataTransfer.getData('text/html')
      }
    }
  }
}

/*
Implements drag+drop move operation.

  - remember current selection (node that is dragged)
  - delete current selection (removes node from original position)
  - determine node selection based on given insertPos
  - paste node at new insert position
*/
class MoveNode extends DragAndDropHandler {
  match(dragState) {
    let {insertPos} = dragState.dropParams
    return dragState.dropType === 'place' && insertPos >= 0 && !dragState.external
  }

  drop(tx, dragState) {
    let { insertPos } = dragState.dropParams
    tx.setSelection(dragState.sourceSelection)
    let copy = tx.copySelection()
    // just clear, but don't merge or don't insert a new node
    tx.deleteSelection({ clear: true })
    let containerId = dragState.targetSurface.getContainerId()
    let surfaceId = dragState.targetSurface.getName()
    let container = tx.get(containerId)
    let targetNode = container.nodes[insertPos]
    let insertMode = 'before'
    if (!targetNode) {
      targetNode = container.nodes[insertPos-1]
      insertMode = 'after'
    }
    tx.setSelection({
      type: 'node',
      nodeId: targetNode,
      mode: insertMode,
      containerId: containerId,
      surfaceId: surfaceId
    })
    tx.paste(copy)
  }
}


class InsertNodes extends DragAndDropHandler {
  match(dragState) {
    return dragState.dropType === 'place' && dragState.external
  }

  drop(tx, dragState) {
    let { insertPos } = dragState.dropParams
    let files = dragState.data.files
    let uris = dragState.data.uris
    let containerId = dragState.targetSurface.getContainerId()
    let nodeId = dragState.targetNodeId
    let surfaceId = dragState.targetSurface.id
    let container = tx.get(containerId)
    let targetNode = container.nodes[insertPos]
    let insertMode = 'before'
    if (!targetNode) {
      targetNode = container.nodes[insertPos-1]
      insertMode = 'after'
    }

    tx.setSelection({
      type: 'node',
      nodeId: nodeId,
      mode: insertMode,
      containerId: containerId,
      surfaceId: surfaceId
    })
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
  }
}

/*
  Built-in handler that calls a custom handler, specified
  on the component (e.g. see ImageComponent).
*/
class CustomHandler extends DragAndDropHandler {
  constructor(assetDropHandlers) {
    super()
    this.assetDropHandlers = assetDropHandlers
  }

  match(dragState) {
    return dragState.dropType === 'custom'
  }

  drop(tx, dragState) {
    // Delegate handling to component which set up the custom dropzone
    dragState.component.handleDrop(tx, dragState)
  }
}


export default DragManager
