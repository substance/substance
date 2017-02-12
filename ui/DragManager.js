import Component from '../ui/Component'
import DragAndDropHandler from '../ui/DragAndDropHandler'
import DefaultDOMElement from '../dom/DefaultDOMElement'
import EventEmitter from '../util/EventEmitter'
import inBrowser from '../util/inBrowser'
import platform from '../util/platform'
import { getDOMRangeFromEvent, isMouseInsideDOMSelection } from '../util/windowUtils'
import DocumentChange from '../model/DocumentChange'

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
      this.el.on('dragstart', this.onDragStart, this)
      this.el.on('dragend', this.onDragEnd, this)
      this.el.on('dragenter', this.onDragEnter, this)
      this.el.on('dragexit', this.onDragExit, this)
    }
  }

  dispose() {
    if (this.el) {
      this.el.off(this)
    }
  }

  onDragStart(e) {
    // console.log('#### DragManager.onDragStart')
    this._initDrag(e, { external: false })
    // Ensure we have a small dragIcon, so dragged content does not eat up
    // all screen space.
    var img = document.createElement("img")
    img.src = "data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==";
    e.dataTransfer.setDragImage(img, 0, 0)
    // TODO: the following might probably not work in FF as it disallows setting the drag data
    // Note: setData('text/html', ... ) is necessary so that the browser shows
    // the target caret while dragging, the content must be allowed to drop inline
    // console.log('#### dragState.mode', )
    if (this.dragState.mode === 'inline') {
      e.dataTransfer.setData('text/html', img.outerHTML)
    } else {
      // otherwise we clear the data trying to make the caret
      // invisible this way
      e.dataTransfer.setData('text/html', '<div></div>')
    }
  }

  /*
    When drag starts externally, e.g. draggin a file into the workspace
  */
  onDragEnter(e) {
    if (!this.dragState) {
      // console.log('onDragEnter(e)', e)
      this._initDrag(e, {external: true})
    }
  }

  onDragEnd(event) {
    // console.log('onDragEnd', event)
    this._onDragEnd(event)
  }

  _onDragEnd(event) {
    try {
      if (!this.dragState) {
        // TODO: There are cases where _onDragEnd is called manually via
        // handleDrop and another time via the native dragend event. check
        // why this happens and how it can be avoided
        console.warn('Not in a valid drag state.')
      } else if (this.dragState.selectionDrag) {
        this._dragSelection(event)
      } else {
        this.emit('drag:finished')
      }
    } finally {
      this.dragState = null
    }
  }

  onDragExit(e) {
    if (platform.isFF) {
      // FF fires this quite rapidly
    } else {
      // TODO: OTOH, we need to find out if this
      // is really necessary in the other browsers
      // console.log('onDragExit', e)
      this._onDragEnd(e)
    }
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
    this._onDragEnd(e)
  }

  /*
    Initializes dragState, which encapsulate state through the whole
    drag + drop operation.

    ATTENTION: This can not be debugged properly in Chrome
  */
  _initDrag(event, options) {
    // TODO: we need to figure out how to enable dragging cursors
    // e.g., when dragging an inline node containing an img, it looks
    // nice, showing the target caret and a dragging cursor.
    // Doing the same just with text content does show the forbidden symbol

    // console.log('_initDrag')
    let sel = this._getSelection()
    let dragState = Object.assign({}, { event, mode: 'block'}, options)
    this.dragState = dragState

    // external drag
    // Note: we only consider drops on the block-level or with custom dropzones
    if (dragState.external) {
      dragState.selectionDrag = false
      dragState.sourceSelection = null
      dragState.scrollPanes = this._getSurfacesGroupedByScrollPane()
      this.emit('drag:started', dragState)
      return
    }

    // Note: selection drags are always without drop-zones,
    // but using the native cursor
    let isSelectionDrag = (
      (sel.isPropertySelection() || sel.isContainerSelection()) &&
      isMouseInsideDOMSelection(event)
    )
    if (isSelectionDrag) {
      // TODO: we do not support dragging of ContainerSelection yet
      if (sel.isContainerSelection()) {
        console.warn('Dragging of ContainerSelection is not supported yet.')
        return _stop()
      }
      // console.log('DragManager: starting a selection drag', sel.toString())
      dragState.selectionDrag = true
      dragState.sourceSelection = sel
      dragState.mode = 'inline'
      // TODO: should we emit for dropzones?
      return
    }
    let comp = Component.unwrap(event.target)
    if (!comp) return _stop()
    let isolatedNodeComponent
    if (comp._isInlineNodeComponent) {
      isolatedNodeComponent = comp
      dragState.mode = 'inline'
    } else {
      isolatedNodeComponent = comp.context.isolatedNodeComponent
    }
    if (!isolatedNodeComponent) return _stop()
    let surface = isolatedNodeComponent.context.surface
    // dragging an InlineNode
    if(isolatedNodeComponent._isInlineNodeComponent) {
      let inlineNode = isolatedNodeComponent.props.node
      dragState.selectionDrag = true
      dragState.sourceSelection = {
        type: 'property',
        path: inlineNode.start.path,
        startOffset: inlineNode.start.offset,
        endOffset: inlineNode.end.offset,
        containerId: surface.getContainerId(),
        surfaceId: surface.id
      }
      dragState.mode = 'inline'
      return
    }
    // dragging an IsolatedNode
    // console.log('DragManager: started dragging a node or from external')
    dragState.selectionDrag = false
    dragState.sourceSelection = {
      type: 'node',
      nodeId: isolatedNodeComponent.props.node.id,
      containerId: surface.getContainerId(),
      surfaceId: surface.id
    }
    // We store the scrollPanes in dragState so the Dropzones component
    // can use it to compute dropzones per scrollpane for each contained
    // surface
    dragState.scrollPanes = this._getSurfacesGroupedByScrollPane()
    // console.log('... emitting dragstart for Dropzones')
    this.emit('drag:started', dragState)

    function _stop() {
      // console.log('.... NOPE')
      event.preventDefault()
      event.stopPropagation()
    }
  }

  _dragSelection(event) {
    event.preventDefault()
    event.stopPropagation()
    let editorSession = this.context.editorSession
    let doc = editorSession.getDocument()
    let sourceSel = this.dragState.sourceSelection
    let wrange = getDOMRangeFromEvent(event)
    if (!wrange) return
    let comp = Component.unwrap(event.target)
    if (!comp) return
    let domSelection = comp.context.domSelection
    if (!domSelection) return
    let range = domSelection.mapDOMRange(wrange)
    if (!range) return
    let targetSel = doc._createSelectionFromRange(range)
    editorSession.transaction((tx) => {
      tx.selection = sourceSel
      let snippet = tx.copySelection()
      tx.deleteSelection()
      tx.selection = DocumentChange.transformSelection(targetSel, tx)
      tx.paste(snippet)
    })
  }

  _getSurfacesGroupedByScrollPane() {
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
        scrollPanes[scrollPaneName] = { scrollPane, surfaces }
      } else {
        scrollPanes[scrollPaneName].surfaces[surfaceName] = surface
      }
    })
    return scrollPanes
  }

  _getSelection() {
    return this.context.editorSession.getSelection()
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
