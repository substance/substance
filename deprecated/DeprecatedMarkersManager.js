import forEach from '../util/forEach'
import deleteFromArray from '../util/deleteFromArray'
import ArrayTree from '../util/ArrayTree'
import Marker from '../model/Marker'

/*
  MarkersManager keeps track of any Markers, which are annotations
  owned by the application, as opposed to real annotations part
  of the document.

  In addition to that, MarkersManager tracks changes to any text properties
  scheduling rerenderings of dirty properties together with any changed
  annotations.
  NOTE: this functionality is somewhat misplaced, but still here it
  is the best place we have so far. In a flux way of thinking, this instance
  derives the app state regarding text property states
  and dispatches them to all relevant components.
*/
export default class DeprecatedMarkersManager {
  constructor (editorSession) {
    this.editorSession = editorSession

    // registry
    this._textProperties = {}
    this._dirtyProps = {}

    this._markers = new MarkersIndex(this)

    // keep markers up-to-date, and record which text properties
    // are affected by a change
    editorSession.onUpdate('document', this._onChange, this)

    // trigger rerendering of 'dirty' text properties
    editorSession.onRender(this._updateProperties, this)
  }

  dispose () {
    this.editorSession.off(this)
    this._markers.dispose()
  }

  setMarkers (key, markers) {
    this.clearMarkers(key)
    markers.forEach(m => this.addMarker(key, m))
  }

  addMarker (key, marker) {
    marker._key = key
    if (!marker._isMarker) {
      marker = new Marker(this.editorSession.getDocument(), marker)
    }
    this._markers.add(marker)
  }

  clearMarkers (key) {
    this._markers.clear(key)
  }

  /*
    Used internally by TextPropertyComponent to register for updates.
  */
  register (textProperyComponent) {
    let path = String(textProperyComponent.getPath())
    // console.log('registering property', path)
    let textProperties = this._textProperties[path]
    if (!textProperties) {
      textProperties = this._textProperties[path] = []
    }
    textProperties.push(textProperyComponent)
  }

  deregister (textProperyComponent) {
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

  getMarkers (path, opts) {
    opts = opts || {}
    let doc = this.editorSession.getDocument()
    let annos = doc.getAnnotations(path) || []
    let markers = this._markers.get(path, opts.surfaceId, opts.containerId)
    return annos.concat(markers)
  }

  _onChange (change) {
    // console.log('MarkersManager.onChange()', change)
    this._markers._onDocumentChange(change)
    this._recordDirtyTextProperties(change)
  }

  _recordDirtyTextProperties (change) {
    // mark all updated props per se as dirty
    forEach(change.updated, (val, id) => {
      this._dirtyProps[id] = true
    })
  }

  /*
    Trigger rerendering of all dirty text properties.
  */
  _updateProperties () {
    // console.log('MarkersManager._updateProperties()')
    Object.keys(this._dirtyProps).forEach((path) => {
      let textProperties = this._textProperties[path]
      if (textProperties) {
        textProperties.forEach(this._updateTextProperty.bind(this))
      }
    })
    this._dirtyProps = {}
  }

  /*
    Here a dirty text property is rerendered via calling setState()
  */
  _updateTextProperty (textPropertyComponent) {
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
  constructor (manager) {
    this._manager = manager

    this._byKey = new ArrayTree()
    this._documentMarkers = new ArrayTree()
    this._surfaceMarkers = {}
    this._containerMarkers = {}
  }

  get (path, surfaceId) {
    let markers = this._documentMarkers[path] || []
    if (surfaceId && this._surfaceMarkers[surfaceId]) {
      let surfaceMarkers = this._surfaceMarkers[surfaceId][path]
      if (surfaceMarkers) markers = markers.concat(surfaceMarkers)
    }
    // TODO support container scoped markers
    return markers
  }

  add (marker) {
    const key = marker._key
    this._byKey.add(key, marker)
    this._add(marker)
  }

  // used to remove a single marker when invalidated
  remove (marker) {
    const key = marker._key
    this._byKey.remove(key, marker)
    this._remove(marker)
  }

  // remove all markers for a given key
  clear (key) {
    let markers = this._byKey.get(key)
    markers.forEach((marker) => {
      this._remove(marker)
    })
  }

  _add (marker) {
    const dirtyProps = this._manager._dirtyProps
    // console.log('Indexing marker', marker)
    const scope = marker.scope || 'document'
    switch (scope) {
      case 'document': {
        const path = marker.start.path
        // console.log('Adding marker for path', path, marker)
        dirtyProps[path] = true
        this._documentMarkers.add(path, marker)
        break
      }
      case 'surface': {
        if (!this._surfaceMarkers[marker.surfaceId]) {
          this._surfaceMarkers[marker.surfaceId] = new ArrayTree()
        }
        const path = marker.start.path
        dirtyProps[path] = true
        this._surfaceMarkers[marker.surfaceId].add(path, marker)
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

  _remove (marker) {
    const dirtyProps = this._manager._dirtyProps
    const scope = marker.scope || 'document'
    switch (scope) {
      case 'document': {
        const path = marker.start.path
        dirtyProps[path] = true
        this._documentMarkers.remove(path, marker)
        break
      }
      case 'surface': {
        if (!this._surfaceMarkers[marker.surfaceId]) {
          this._surfaceMarkers[marker.surfaceId] = new ArrayTree()
        }
        const path = marker.start.path
        dirtyProps[path] = true
        this._surfaceMarkers[marker.surfaceId].remove(path, marker)
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

  // used for applying transformations
  _getAllCustomMarkers (path) {
    let markers = this._documentMarkers[path] || []
    for (let surfaceId in this._surfaceMarkers) {
      if (!this._surfaceMarkers.hasOwnProperty(surfaceId)) continue
      let surfaceMarkers = this._surfaceMarkers[surfaceId][path]
      if (surfaceMarkers) markers = markers.concat(surfaceMarkers)
    }
    // TODO: support container markers
    return markers
  }

  _onDocumentChange (change) {
    change.ops.forEach((op) => {
      if (op.type === 'update' && op.diff._isTextOperation) {
        let markers = this._getAllCustomMarkers(op.path)
        let diff = op.diff
        switch (diff.type) {
          case 'insert':
            this._transformInsert(markers, diff)
            break
          case 'delete':
            this._transformDelete(markers, diff)
            break
          default:
            //
        }
      }
    })
  }

  _transformInsert (markers, op) {
    const pos = op.pos
    const length = op.str.length
    if (length === 0) return
    markers.forEach((marker) => {
      // console.log('Transforming marker after insert')
      var start = marker.start.offset
      var end = marker.end.offset
      var newStart = start
      var newEnd = end
      if (pos >= end) return
      if (pos <= start) {
        newStart += length
        newEnd += length
        marker.start.offset = newStart
        marker.end.offset = newEnd
        return
      }
      if (pos < end) {
        newEnd += length
        marker.end.offset = newEnd
        // NOTE: right now, any change inside a marker
        // removes the marker, as opposed to changes before
        // which shift the marker
        this._remove(marker)
      }
    })
  }

  _transformDelete (markers, op) {
    const pos1 = op.pos
    const length = op.str.length
    const pos2 = pos1 + length
    if (pos1 === pos2) return
    markers.forEach((marker) => {
      var start = marker.start.offset
      var end = marker.end.offset
      var newStart = start
      var newEnd = end
      if (pos2 <= start) {
        newStart -= length
        newEnd -= length
        marker.start.offset = newStart
        marker.end.offset = newEnd
      } else if (pos1 >= end) {

      // the marker needs to be changed
      // now, there might be cases where the marker gets invalid, such as a spell-correction
      } else {
        if (pos1 <= start) {
          newStart = start - Math.min(pos2 - pos1, start - pos1)
        }
        if (pos1 <= end) {
          newEnd = end - Math.min(pos2 - pos1, end - pos1)
        }
        // TODO: we should do something special when the change occurred inside the marker
        if (start !== end && newStart === newEnd) {
          this._remove(marker)
          return
        }
        if (start !== newStart) {
          marker.start.offset = newStart
        }
        if (end !== newEnd) {
          marker.end.offset = newEnd
        }
        this._remove(marker)
      }
    })
  }
}
