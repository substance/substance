import forEach from '../util/forEach'
import ArrayTree from '../util/ArrayTree'
import Fragmenter from './Fragmenter'
import DocumentIndex from './DocumentIndex'

/*
  A DocumentIndex implementation for keeping track of markers.

  Markers are representations of nodes which are rendered as annotations on TextPropertyComponents.
  There are three basic node types which induce one or multiple Markers: PropertyAnnotations, ContainerAnnotations, and CustomMarkers.

   - PropertyAnnotations can be used as Markers without transformation.
   - ContainerAnnotations for which a set of markers is maintained, for all TextProperties covered by the annotation.
   - CustomMarkers are created by the UI and are not part of the real document. CustomMarkers are transformed to reflect
     changes to the TextProperty they are attached to.
*/
class MarkersIndex extends DocumentIndex {

  constructor(editorSession) {
    super()

    this.editorSession = editorSession
    this.document = editorSession.getDocument()
    this._documentMarkers = new ArrayTree()
    this._surfaceMarkers = {}
    this._containerMarkers = {}

    this._containerFragments = {}

    this._dirtyProps = {}

    // TODO: as this is very visual we should implement this as a DocumentIndex which
    // gets called directly after the op is applied
    // instead we should use our own 'dispatcher' onDocumentChange, where the model is up2date already
    this.document.addIndex('markers', this)
    editorSession.onUpdate('document', this._onDocumentChange, this)
  }

  dispose() {
    // TODO: add an API to remove a custom index
    // and we should add a test which disposes the editor session
    delete this.document.data.indexes['markers']
    this.editorSession.off(this)
  }

  reset() {
    this._documentMarkers = new ArrayTree()
    this._surfaceMarkers = {}
    this._containerMarkers = {}
    let doc = this.document
    forEach(doc.getNodes(), (node) => {
      if (this.select(node)) {
        this.create(node)
      }
    })
  }

  get(path, surfaceId, containerId) {
    let markers = this._documentMarkers[path] || []
    if (surfaceId && this._surfaceMarkers[surfaceId]) {
      let surfaceMarkers = this._surfaceMarkers[surfaceId][path]
      if (surfaceMarkers) markers = markers.concat(surfaceMarkers)
    }
    if (containerId && this._containerMarkers[containerId]) {
      let containerMarkers = this._containerMarkers[containerId][path]
      if (containerMarkers) markers = markers.concat(containerMarkers)
    }
    return markers
  }

  select(node) {
    return node._isAnnotation
  }

  create(node) {
    if (node._isPropertyAnnotation) {
      // TODO: we want to manage the markers representing PropertyAnnotations as well.
      // ATM, we are using them directly, as PropertyAnnotations are fullfilling the Marker interface
    } else if (node._isContainerAnnotation) {
      this._createContainerAnnotationMarkers(node)
    } else if (node._isCustomMarker) {
      this._createCustomMarker(node)
    } else {
      // should not happen
    }
  }

  delete(node) {
    if (node._isPropertyAnnotation) {
      // TODO: we want to manage the markers representing PropertyAnnotations as well.
      // ATM, we are using them directly, as PropertyAnnotations are fullfilling the Marker interface
    } else if (node._isContainerAnnotation) {
      this._deleteContainerAnnotationMarkers(node)
    } else if (node._isCustomMarker) {
      this._deleteCustomMarker(node)
    } else {
      // should not happen
    }
  }

  update(node, path, newValue, oldValue) { // eslint-disable-line
    // TODO: update index when an annotion is changed via 'update'
    if (node._isPropertyAnnotation) {
      // TODO: we want to manage the markers representing PropertyAnnotations as well.
      // ATM, we are using them directly, as PropertyAnnotations are fullfilling the Marker interface
    } else if (node._isContainerAnnotation) {
      const coor = path[1]
      const prop = path[2]
      if ((coor === 'start' || coor === 'end') && prop === 'path') {
        this._deleteContainerAnnotationMarkers(node)
        this._createContainerAnnotationMarkers(node)
      }
    } else if (node._isCustomMarker) {
      this._deleteCustomMarker(node)
    } else {
      // should not happen
    }
  }

  _createContainerAnnotationMarkers(anno) {
    // TODO: create fragments for all spanned properties
    const doc = this.document
    const containerId = anno.containerId
    const container = doc.get(containerId, 'strict')
    const startPos = container.getPosition(anno.start.path[0])
    const endPos = container.getPosition(anno.end.path[0])

    if (!this._containerMarkers[containerId]) {
      this._containerMarkers[containerId] = new ArrayTree()
    }

    let fragments = []
    // NOTE: for now we only create fragments for spanned TextNodes
    // TODO: support list items
    for (let i = startPos; i <= endPos; i++) {
      let node = container.getChildAt(i)
      if (!node.isText()) continue
      const path = node.getTextPath()
      let fragment = {
        type: 'container-annotation-fragment',
        anno: anno,
        id: anno.id,
        path: path,
        start: { offset: Fragmenter.FIRST },
        end: { offset: Fragmenter.LAST }
      }
      if (i === startPos) {
        fragment.start = anno.start
        fragment.isFirst = true
      }
      if (i === endPos) {
        fragment.end = anno.end
        fragment.isLast = true
      }

      this._dirtyProps[path] = true
      this._containerMarkers[containerId].add(path, fragment)
      fragments.push(fragment)
    }

    this._containerFragments[anno.id] = fragments
  }

  _createCustomMarker(customMarker) {
    switch (customMarker.constructor.scope) {
      case 'document': {
        this._dirtyProps[customMarker.path] = true
        this._documentMarkers.add(customMarker.path, customMarker)
        break
      }
      case 'surface': {
        if (!this._surfaceMarkers[customMarker.surfaceId]) {
          this._surfaceMarkers[customMarker.surfaceId] = new ArrayTree()
        }
        this._dirtyProps[customMarker.path] = true
        this._surfaceMarkers[customMarker.surfaceId].add(customMarker.path, customMarker)
        break
      }
      case 'container': {
        console.warn('Container scoped markers are not supported yet')
        break
      }
      default:
        console.error('Invalid marker scope.')
    }
  }

  _deleteContainerAnnotationMarkers(anno) {
    const fragments = this._containerFragments[anno.id]
    const markers = this._containerMarkers[anno.containerId]
    for (let i = 0; i < fragments.length; i++) {
      const fragment = fragments[i]
      const path = fragment.path
      markers.remove(path, fragment)
      this._dirtyProps[path] = true
    }
  }

  _deleteCustomMarker(customMarker) {
    switch (customMarker.constructor.scope) {
      case 'document': {
        this._dirtyProps[customMarker.path] = true
        this._documentMarkers.remove(customMarker.path, customMarker)
        break
      }
      case 'surface': {
        if (!this._surfaceMarkers[customMarker.surfaceId]) {
          this._surfaceMarkers[customMarker.surfaceId] = new ArrayTree()
        }
        this._dirtyProps[customMarker.path] = true
        this._surfaceMarkers[customMarker.surfaceId].remove(customMarker.path, customMarker)
        break
      }
      case 'container': {
        console.warn('Container scoped markers are not supported yet')
        break
      }
      default:
        console.error('Invalid marker scope.')
    }
  }

  _collectDirtyProps() {
    let dirtyProps = this._dirtyProps
    this._dirtyProps = {}
    return dirtyProps
  }

  // used for applying transformations
  _getCustomMarkers(path) {
    let markers = this._documentMarkers[path] || []
    for(let surfaceId in this._surfaceMarkers) {
      if (!this._surfaceMarkers.hasOwnProperty(surfaceId)) continue
      let surfaceMarkers = this._surfaceMarkers[surfaceId][path]
      if (surfaceMarkers) markers = markers.concat(surfaceMarkers)
    }
    // TODO: support custom container markers
    return markers.filter(m => m._isCustomMarker)
  }

  // EXPERIMENTAL: custom markers are not affected by document ops automatically
  // as they are actually a visual thing thus we update them here
  _onDocumentChange(change) {
    const doc = this.doc
    for (let i = 0; i < change.ops.length; i++) {
      const op = change.ops[i]
      let markers = this._getCustomMarkers(op.path)
      if (op.type === 'update' && op.diff._isTextOperation) {
        let diff = op.diff
        switch (diff.type) {
          case 'insert':
            this._transformAfterInsert(doc, markers, diff)
            break
          case 'delete':
            this._transformAfterDelete(doc, markers, diff)
            break
          default:
            //
        }
      }
    }
  }

  _transformAfterInsert(doc, markers, op) {
    const pos = op.pos
    const length = op.str.length
    if (length === 0) return
    for (let i = 0; i < markers.length; i++) {
      const marker = markers[i]
      const start = marker.start.offset
      const end = marker.end.offset
      let newStart = start
      let newEnd = end
      if (pos >= end) return
      if (pos <= start) {
        newStart += length
        newEnd += length
        marker.start.offset = newStart
        marker.end.offset = newEnd
        return
      }
      if (pos < end) {
        newEnd += length;
        marker.end.offset = newEnd
        if (marker.invalidate) marker.invalidate()
      }
    }
  }

  _transformAfterDelete(doc, markers, op) {
    const pos1 = op.pos
    const length = op.str.length
    const pos2 = pos1 + length
    if (pos1 === pos2) return
    for (let i = 0; i < markers.length; i++) {
      const marker = markers[i]
      const start = marker.start.offset
      const end = marker.end.offset
      let newStart = start
      let newEnd = end
      if (pos2 <= start) {
        newStart -= length
        newEnd -= length
        marker.start.offset = newStart
        marker.end.offset = newEnd
      } else if (pos1 >= end) {
        // nothing
      }
      // the marker needs to be changed
      // now, there might be cases where the marker gets invalid, such as a spell-correction
      else {
        if (pos1 <= start) {
          newStart = start - Math.min(pos2-pos1, start-pos1)
        }
        if (pos1 <= end) {
          newEnd = end - Math.min(pos2-pos1, end-pos1)
        }
        // TODO: we should do something special when the change occurred inside the marker
        if (start !== end && newStart === newEnd) {
          marker.remove()
          return
        }
        if (start !== newStart) {
          marker.start.offset = newStart
        }
        if (end !== newEnd) {
          marker.end.offset = newEnd
        }
        if (marker.invalidate) marker.invalidate()
      }
    }
  }
}

export default MarkersIndex