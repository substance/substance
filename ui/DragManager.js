import NodeSelection from '../model/NodeSelection'
import Component from '../ui/Component'
import DragAndDropHandler from '../ui/DragAndDropHandler'
import DefaultDOMElement from '../dom/DefaultDOMElement'
import EventEmitter from '../util/EventEmitter'
import inBrowser from '../util/inBrowser'
import getRelativeBoundingRect from '../util/getRelativeBoundingRect'

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
      // HACK: We find the first ContainerEditor
      // TODO: We must support multiple container editors, which can live in multiple scroll panes
      let surfaces = Object.keys(this.context.surfaceManager.surfaces).map((surfaceId) => {
        return this.context.surfaceManager.surfaces[surfaceId]
      })
      let surface = surfaces.find((surface) => { return surface.isContainerEditor() })

      // TODO: Compute dropzones for multiple surfaces (container editors)
      dragState.dropzones = this._computeDropzones(surface)
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

    this.dragState = new DragState(dragState)
    e.dataTransfer.effectAllowed = 'all'
    e.dataTransfer.setData('text/html', e.target.outerHTML)

    // Ensure we have a small dragIcon, so dragged content does not eat up
    // all screen space.
    var dragIcon = document.createElement('img')
    dragIcon.width = 30
    e.dataTransfer.setDragImage(dragIcon, -10, -10)

    this.emit('dragstart', this.dragState)
  }

  /*
    Get bounding rect for a component (relative to scrollPane content element)
  */
  _getBoundingRect(comp) {
    let scrollPane = comp.context.scrollPane
    let contentElement = scrollPane.getContentElement().getNativeElement()
    let rect = getRelativeBoundingRect(comp.getNativeElement(), contentElement)
    return rect
  }

  _computeDropzones(surface) {
    let components = surface.childNodes

    // e.g. 3 components = 4 drop zones (1 before, 1 after, 2 in-between)
    let numDropzones = components.length + 1
    let dropzones = []

    for (let i = 0; i < numDropzones; i++) {
      if (i === 0) {
        // First dropzone
        let firstComp = this._getBoundingRect(components[0])
        dropzones.push({
          type: 'place',
          left: firstComp.left,
          top: firstComp.top,
          width: firstComp.width,
          height: firstComp.height / 2,
          teaserPos: 0,
          dropParams: {
            insertPos: i
          }
        })
      } else if (i === numDropzones - 1) {
        // Last dropzone
        let lastComp = this._getBoundingRect(components[i - 1])
        dropzones.push({
          type: 'place',
          left: lastComp.left,
          top: lastComp.top + lastComp.height / 2,
          width: lastComp.width,
          height: lastComp.height / 2,
          teaserPos: lastComp.height / 2,
          dropParams: {
            insertPos: i
          }
        })
      } else {
        // Drop zone in between two components
        let upperComp = this._getBoundingRect(components[i-1])
        let lowerComp = this._getBoundingRect(components[i])
        let topBound = upperComp.top + upperComp.height / 2
        let bottomBound = lowerComp.top + lowerComp.height / 2

        dropzones.push({
          type: 'place',
          left: upperComp.left,
          top: topBound,
          width: upperComp.width,
          height: bottomBound - topBound,
          teaserPos: (upperComp.top + upperComp.height + lowerComp.top) / 2 - topBound,
          dropParams: {
            insertPos: i
          }
        })
      }

      if (i < numDropzones - 2) {
        let comp = components[i]
        // We get the isolated node wrapper and want to use the content element
        // TODO: Let's add an API for that comp.getContentComponent()
        if (comp.refs.content) {
          comp = comp.refs.content
        }
        // If component has dropzones declared
        if (comp.getDropzoneSpecs) {
          let dropzoneSpecs = comp.getDropzoneSpecs()
          dropzoneSpecs.forEach((dropzoneSpec) => {
            let dropzoneComp = dropzoneSpec.component
            let rect = this._getBoundingRect(dropzoneComp)
            // console.log('dropcomp', dropComp)
            dropzones.push({
              type: 'custom',
              component: comp,
              dropzoneComponent: dropzoneComp,
              left: rect.left,
              top: rect.top,
              width: rect.width,
              height: rect.height,
              message: dropzoneSpec.message,
              dropParams: dropzoneSpec.dropParams
            })
          })
        }
      }

    }
    console.log('le dropzones', dropzones)
    return dropzones
  }

  _onDragOver(/*e*/) {
    // console.log('_onDragOver', e)
    // this._updateDrag(e)
  }

  _onDragEnter(e) {
    // console.log('_onDragEnter(e)', e)
    // debugger
    // console.log('this.dragState', this.dragState)

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
  Models dragState object that's encoding the state during a drag and drop
  operation.
*/
class DragState {
  constructor(data) {
    this.mode = data.mode
    this.targetEl = data.targetEl
    this.dropzones = data.dropzones
    this.surfaceId = data.surfaceId
    this.sourceSelection = data.sourceSelection
    this.event = data.event
  }
}

/*
  Built-in handler for move operations
*/
class MoveNode extends DragAndDropHandler {
  match(dragState) {
    let {insertPos} = dragState.dropParams
    return dragState.dropType === 'place' && insertPos >= 0 && !dragState.external
  }

  /*
    Implements drag+drop move operation.

    - remember current selection (node that is dragged)
    - delete current selection (removes node from original position)
    - determine node selection based on given insertPos
    - paste node at new insert position
  */
  drop(tx, dragState) {
    let { insertPos } = dragState.dropParams
    tx.setSelection(dragState.sourceSelection)
    let copy = tx.copySelection()
    // just clear, but don't merge or don't insert a new node
    tx.deleteSelection({ clear: true })

    let containerId = dragState.sourceSelection.containerId
    let surfaceId = dragState.sourceSelection.surfaceId
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
    let files = dragState.data.files
    let uris = dragState.data.uris
    let containerId = dragState.surface.getContainerId()
    let nodeId = dragState.targetNodeId
    let insertMode = dragState.insertMode
    let surfaceId = dragState.surface.id

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
