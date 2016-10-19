import uniq from 'lodash/uniq'
import map from '../util/map'
import forEach from '../util/forEach'

/*

*/
class MarkersManager {

  constructor(editSession) {
    this.editSession = editSession
    // document markers
    this.markers = {}
    // registry
    this._configs = {}
    this._observers = {}
    this._dirtyProps = {}
    // cached data
    this._documentMarkers = {}
    this._surfaceMarkers = {}
    this._containerMarkers = {}

    editSession.on('model', this._onDocumentChange, this)
    editSession.on('render', this._updateProperties, this)
  }

  dispose() {
    this.editSession.off(this)
  }

  register(observer, path, opts) {
    path = String(path)
    opts = opts || {}
    const surfaceId = opts.surfaceId
    const containerId = opts.containerId
    let o = this._observers[path]
    if (!o) {
      o = this._observers[path] = []
    }
    o.push({
      observer: observer,
      surfaceId: surfaceId,
      containerId: containerId
    })
    this._updateRegistration(path)
    return this._initialFetch(path, surfaceId, containerId)
  }

  deregister(observer, path) {
    path = String(path)
    let o = this._observers[path]
    for (var i = 0; i < o.length; i++) {
      if (o[i].observer === observer) {
        o.splice(i, 1)
      }
    }
    this._updateRegistration(path)
  }

  _updateRegistration(path) {
    let o = this._observers[path]
    let config = { containerIds: [], surfaceIds: []}
    if (o.length === 0) {
      // TODO: stop watching
      delete this._documentMarkers[path]
      delete this._surfaceMarkers[path]
      delete this._containerMarkers[path]
      delete this._observers[path]
      delete this._configs[path]
    } else {
      for (var i = 0; i < o.length; i++) {
        if (o[i].surfaceId) {
          config.surfaceIds.push(o[i].surfaceId)
        }
        if (o[i].containerId) {
          config.containerIds.push(o[i].containerIds)
        }
      }
      config.containerIds = uniq(config.containerIds)
      config.surfaceIds = uniq(config.surfaceIds)
      this._configs[path] = config
    }
  }

  _initialFetch(path, surfaceId, containerId) {
    // initial fetch
    let result = []
    // document markers are property annos, spell-errors
    if (!this._documentMarkers[path]) {
      result = result.concat(this._fetchDocumentMarkers(path))
    }
    // TODO: maybe not store all in one to avoid clashes with containerIds
    if (surfaceId && !this._surfaceMarkers[String([surfaceId].concat(path))]) {
      result = result.concat(this._fetchSurfaceMarkers(path, surfaceId))
    }
    if (containerId && !this._containerMarkers[String([containerId].concat(path))]) {
      result = result.concat(this._fetchContainerMarkers(path, containerId))
    }
    return result
  }

  _fetchDocumentMarkers(path) {
    let annos = map(this.editSession.getDocument().getAnnotations(path))
    let markers = this.markers[path]
    let documentMarkers = annos.concat(markers)
    this._documentMarkers[path] = documentMarkers
    return documentMarkers
  }

  _fetchSurfaceMarkers(path, surfaceId) {
    // TODO: implement this to bring back
    let surfaceMarkers = []
    this._surfaceMarkers[path] = surfaceMarkers
    return surfaceMarkers
  }

  _fetchContainerMarkers(path, containerId) {
    let containerMarkers = []
    this._containerMarkers[path] = containerMarkers
    return containerMarkers
  }

  // helpers for computing selection markers
  _getMarkersForSelection(sel) {
    // only PropertySelections are supported right now
    if (!sel || !sel.isPropertySelection()) return []
    const path = sel.getPath()
    // markers are stored as one hash for each path, grouped by marker key
    let markers = this._markers.getAll(path)
    const filtered = markers.filter(function(m) {
      return m.isInsideOf(sel)
    })
    return filtered
  }

  _onDocumentChange(editSession) {
    if (editSession.hasChanged('change')) {
      let change = editSession.get('change')
      // update document markers
      // this._transformMarkers(change)
      // fetch all document markers
      forEach(change.updated, (val, id) => {
        this._fetchDocumentMarkers(id)
        this._dirtyProps[id] = true
      })
    }
  }

  _updateProperties() {
    Object.keys(this._dirtyProps).forEach((id) => {
      let os = this._observers[id]
      if (os) {
        os.forEach((o) => o.observer.updateMarkers([]))
      }
    })
  }

  // for every observed path we need to transform markers
  // at least certain markers
  _transformMarkers(change) {
    let doc = this.doc
    // TODO: we need to update markers, properly. They are not part of the model and need to be moved, expanded, deleted here according
    // to incoming changes
    change.ops.forEach((op) => {
      let markers = this.markers[op.path]
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
      var start = marker.startOffset;
      var end = marker.endOffset;
      var newStart = start;
      var newEnd = end;
      if (pos >= end) return
      if (pos <= start) {
        newStart += length
        newEnd += length
        marker.startOffset = newStart
        marker.endOffset = newEnd
        return
      }
      if (pos < end) {
        newEnd += length;
        marker.endOffset = newEnd
        marker.invalidate()
      }
    })
  }

  _transformDelete(doc, markers, op) {
    const pos1 = op.pos
    const length = op.str.length
    const pos2 = pos1 + length
    if (pos1 === pos2) return
    markers.forEach((marker) => {
      var start = marker.startOffset;
      var end = marker.endOffset;
      var newStart = start;
      var newEnd = end;
      if (pos2 <= start) {
        newStart -= length;
        newEnd -= length;
        marker.startOffset = newStart
        marker.endOffset = newEnd
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
          this._removeMarker(marker)
          return
        }
        if (start !== newStart) {
          marker.startOffset = newStart
        }
        if (end !== newEnd) {
          marker.endOffset = newEnd
        }
        marker.invalidate()
      }
    })
  }
}

export default MarkersManager
