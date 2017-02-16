import forEach from '../util/forEach'
import deleteFromArray from '../util/deleteFromArray'
import ArrayTree from '../util/ArrayTree'

class MarkersManager {

  constructor(editorSession) {
    this.editorSession = editorSession

    // registry
    this._textProperties = {}
    this._dirtyProps = {}

    this._markers = new MarkersIndex(editorSession)

    editorSession.onUpdate(this._onChange, this)
    editorSession.onRender(this._updateProperties, this)
  }

  dispose() {
    this.editorSession.off(this)
    this._markers.dispose()
  }

  register(textProperyComponent) {
    let path = String(textProperyComponent.getPath())
    // console.log('registering property', path)
    let textProperties = this._textProperties[path]
    if (!textProperties) {
      textProperties = this._textProperties[path] = []
    }
    textProperties.push(textProperyComponent)
  }

  deregister(textProperyComponent) {
    let path = String(textProperyComponent.getPath())
    // console.log('deregistering property', path)
    let textProperties = this._textProperties[path]
    if (!textProperties) {
      // FIXME: happens in test suite
      return
    }
    deleteFromArray(this._textProperties[path], textProperyComponent)
    if (textProperties.length === 0) {
      delete this._textProperties[path]
    }
  }

  getMarkers(path, opts) {
    opts = opts || {}
    let doc = this.editorSession.getDocument()
    let annos = doc.getAnnotations(path) || []
    let markers = this._markers.get(path, opts.surfaceId, opts.containerId)
    return annos.concat(markers)
  }

  _onChange(editorSession) {
    if (editorSession.hasDocumentChanged()) {
      // mark all updated props per se as dirty
      if (editorSession.hasDocumentChanged()) {
        let change = editorSession.getChange()
        forEach(change.updated, (val, id) => {
          this._dirtyProps[id] = true
        })
      }
      Object.assign(this._dirtyProps, this._markers._collectDirtyProps())
    }
  }

  _updateProperties() {
    Object.keys(this._dirtyProps).forEach((path) => {
      let textProperties = this._textProperties[path]
      if (textProperties) {
        textProperties.forEach(this._updateTextProperty.bind(this))
      }
    })
    this._dirtyProps = {}
  }

  _updateTextProperty(textPropertyComponent) {
    let path = textPropertyComponent.getPath()
    let markers = this.getMarkers(path, {
      surfaceId: textPropertyComponent.getSurfaceId(),
      containerId: textPropertyComponent.getContainerId()
    })
    // console.log('## providing %s markers for %s', markers.length, path)
    textPropertyComponent.setState({
      markers: markers
    })
  }

}

/*
  A DocumentIndex implementation for keeping track of markers
*/
class MarkersIndex {

  constructor(editorSession) {
    this.editorSession = editorSession
    this.document = editorSession.getDocument()
    this._documentMarkers = new ArrayTree()
    this._surfaceMarkers = {}
    this._containerMarkers = {}

    this._dirtyProps = {}

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

  select(node) {
    return node._isMarker
  }

  create(marker) {
    // console.log('Indexing marker', marker)
    switch (marker.constructor.scope) {
      case 'document': {
        this._dirtyProps[marker.path] = true
        this._documentMarkers.add(marker.path, marker)
        break
      }
      case 'surface': {
        if (!this._surfaceMarkers[marker.surfaceId]) {
          this._surfaceMarkers[marker.surfaceId] = new ArrayTree()
        }
        this._dirtyProps[marker.path] = true
        this._surfaceMarkers[marker.surfaceId].add(marker.path, marker)
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

  delete(marker) {
    switch (marker.constructor.scope) {
      case 'document': {
        this._dirtyProps[marker.path] = true
        this._documentMarkers.remove(marker.path, marker)
        break
      }
      case 'surface': {
        if (!this._surfaceMarkers[marker.surfaceId]) {
          this._surfaceMarkers[marker.surfaceId] = new ArrayTree()
        }
        this._dirtyProps[marker.path] = true
        this._surfaceMarkers[marker.surfaceId].remove(marker.path, marker)
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

  get(path, surfaceId) {
    let markers = this._documentMarkers[path] || []
    if (surfaceId && this._surfaceMarkers[surfaceId]) {
      let surfaceMarkers = this._surfaceMarkers[surfaceId][path]
      if (surfaceMarkers) markers = markers.concat(surfaceMarkers)
    }
    // TODO support container scoped markers
    return markers
  }

  _collectDirtyProps() {
    let dirtyProps = this._dirtyProps
    this._dirtyProps = {}
    return dirtyProps
  }

  // used for applying transformations
  _getAllCustomMarkers(path) {
    let markers = this._documentMarkers[path] || []
    for(let surfaceId in this._surfaceMarkers) {
      if (!this._surfaceMarkers.hasOwnProperty(surfaceId)) continue
      let surfaceMarkers = this._surfaceMarkers[surfaceId][path]
      if (surfaceMarkers) markers = markers.concat(surfaceMarkers)
    }
    // TODO: support container markers
    return markers
  }

  _onDocumentChange(change) {
    let doc = this.doc
    change.ops.forEach((op) => {
      let markers = this._getAllCustomMarkers(op.path)
      if (op.type === 'update' && op.diff._isTextOperation) {
        let diff = op.diff
        switch (diff.type) {
          case 'insert':
            this._transformInsert(doc, markers, diff)
            break
          case 'delete':
            this._transformDelete(doc, markers, diff)
            break
          default:
            //
        }
      }
    })
  }

  _transformInsert(doc, markers, op) {
    const pos = op.pos
    const length = op.str.length
    if (length === 0) return
    markers.forEach(function(marker) {
      // console.log('Transforming marker after insert')
      var start = marker.start.offset;
      var end = marker.end.offset;
      var newStart = start;
      var newEnd = end;
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
    })
  }

  _transformDelete(doc, markers, op) {
    const pos1 = op.pos
    const length = op.str.length
    const pos2 = pos1 + length
    if (pos1 === pos2) return
    markers.forEach((marker) => {
      var start = marker.start.offset;
      var end = marker.end.offset;
      var newStart = start;
      var newEnd = end;
      if (pos2 <= start) {
        newStart -= length;
        newEnd -= length;
        marker.start.offset = newStart
        marker.end.offset = newEnd
      } else if (pos1 >= end) {
        // nothing
      }
      // the marker needs to be changed
      // now, there might be cases where the marker gets invalid, such as a spell-correction
      else {
        if (pos1 <= start) {
          newStart = start - Math.min(pos2-pos1, start-pos1);
        }
        if (pos1 <= end) {
          newEnd = end - Math.min(pos2-pos1, end-pos1);
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
    })
  }

}

export default MarkersManager
