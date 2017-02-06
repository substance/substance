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
      new InsertNodes(this.assetHandlers, this.context),
      new CustomHandler()
    ]
    if (inBrowser) {
      this.el = DefaultDOMElement.wrapNativeElement(document)
      this.el.on('dragstart', this._onDragStart, this)
      this.el.on('dragend', this._onDragEnd, this)
      this.el.on('dragenter', this._onDragEnter, this)
      this.el.on('dragexit', this._onDragExit, this)
    }
  }

  dispose() {
    if (this.el) {
      this.el.off(this)
    }
  }

  _getSelection() {
    return this.context.editorSession.getSelection()
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
  _initDrag(event, options) {
    // console.log('_initDrag')
    let sel = this._getSelection()
    let dragState = Object.assign({}, { event, mode: 'block'}, options)

    let isSelectionDrag = (sel.isPropertySelection() || sel.isContainerSelection()) && this._isMouseInsideDOMSelection(event)
    if (isSelectionDrag) {
      // console.log('DragManager: starting a selection drag', sel.toString())
      dragState.selectionDrag = true
      dragState.sourceSelection = sel
    } else {
      // We need to determine all ContainerEditors and their scrollPanes; those have the drop
      // zones attached
      let surfaces = this.context.surfaceManager.getSurfaces()

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

      // In an internal drag, we receive the source (= node being dragged)
      let comp = this._getIsolatedNodeOrContainerChild(
        DefaultDOMElement.wrapNativeElement(event.target)
      )
      if (comp && comp.props.node) {
        let surface = comp.context.surface
        let nodeSelection = new NodeSelection({
          containerId: surface.getContainerId(),
          nodeId: comp.props.node.id,
          mode: 'full',
          surfaceId: surface.id
        })
        dragState.sourceSelection = nodeSelection
      } else {
        event.preventDefault()
        event.stopPropagation()
      }
    }

    this.dragState = dragState

    // Ensure we have a small dragIcon, so dragged content does not eat up
    // all screen space.
    var img = document.createElement("img")
    img.src = "data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==";
    event.dataTransfer.setDragImage(img, 0, 0)

    if (!isSelectionDrag) {
      this.emit('dragstart', this.dragState)
    }
  }

  /*
    When drag starts externally, e.g. draggin a file into the workspace
  */
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

  _onDragEnd(event) {
    // console.log('_onDragEnd', event)
    try {
      if (!this.dragState) {
        // TODO: There are cases where _onDragEnd is called manually via
        // handleDrop and another time via the native dragend event. check
        // why this happens and how it can be avoided
        console.warn('Not in a valid drag state.')
      } else if (this.dragState.selectionDrag) {
        // cut and paste to destination
        console.log('TODO: drag selection', event)
      } else {
        this.emit('dragend')
      }
    } finally {
      this.dragState = null
    }
  }

  _onDragExit() {
    // console.log('_onDragExit')
    this._onDragEnd()
  }

  /*
    Called by Dropzones component after drop received
  */
  handleDrop(e, dragStateExtensions) {
    let dragState = Object.assign(this.dragState, dragStateExtensions)
    let i, handler
    let match = false

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

    // Manually call onDragEnd since Dropzones component stops further event
    // propagation
    this._onDragEnd()
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
  constructor(assetHandlers, context) {
    super()
    this.assetHandlers = assetHandlers
    this.context = context
  }

  match(dragState) {
    return dragState.dropType === 'place' && dragState.external
  }

  drop(tx, dragState) {
    let { insertPos } = dragState.dropParams
    let files = dragState.data.files
    let uris = dragState.data.uris
    let containerId = dragState.targetSurface.getContainerId()
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
      nodeId: targetNode,
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

  _callHandlers(tx, params) {
    let i, handler;
    for (i = 0; i < this.assetHandlers.length; i++) {
      handler = this.assetHandlers[i]

      let match = handler.match(params, this.context)
      if (match) {
        handler.drop(tx, params, this.context)
        break
      }
    }
  }
}

/*
  Built-in handler that calls a custom handler, specified
  on the component (e.g. see ImageComponent).
*/
class CustomHandler extends DragAndDropHandler {

  match(dragState) {
    return dragState.dropType === 'custom'
  }

  drop(tx, dragState) {
    // Delegate handling to component which set up the custom dropzone
    dragState.component.handleDrop(tx, dragState)
  }
}

export default DragManager
