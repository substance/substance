import { EventEmitter, getKeyForPath, deleteFromArray } from '../util'

export default class MarkersManager extends EventEmitter {
  constructor (editorState) {
    super()

    this._editorState = editorState
    this._markers = new MarkersIndex()

    editorState.addObserver(['document'], this._onDocumentChange, this, { stage: 'update' })
  }

  dispose () {
    this._editorState.removeObserver(this)
  }

  addMarker (marker) {
    const path = marker.getPath()
    this._markers.add(path, marker)
    this._setDirty(path)
  }

  removeMarker (marker) {
    const path = marker.getPath()
    this._markers.remove(path, marker)
    this._setDirty(path)
  }

  clearMarkers (path, filter) {
    this._markers.clearMarkers(path, filter)
    this._setDirty(path)
  }

  getMarkers (path) {
    return this._markers.get(path)
  }

  _getDocumentObserver () {
    return this._editorState._getDocumentObserver()
  }

  _setDirty (path) {
    this._editorState._setDirty('document')
    this._getDocumentObserver().setDirty(path)
  }

  // updating markers to reflect changes on the text they are bound to
  _onDocumentChange (change) {
    for (const op of change.primitiveOps) {
      if (op.type === 'update' && op.diff._isTextOperation) {
        const markers = this._markers.get(op.path)
        if (!markers || markers.length === 0) continue
        const diff = op.diff
        switch (diff.type) {
          case 'insert':
            markers.forEach(m => this._transformInsert(m, diff))
            break
          case 'delete':
            markers.forEach(m => this._transformDelete(m, diff))
            break
          default:
          //
        }
      }
    }
  }

  _transformInsert (marker, op) {
    const pos = op.pos
    const length = op.str.length
    if (length === 0) return
    // console.log('Transforming marker after insert')
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
      newEnd += length
      marker.end.offset = newEnd
      // NOTE: right now, any change inside a marker
      // removes the marker, as opposed to changes before
      // which shift the marker
      this._remove(marker)
    }
  }

  _transformDelete (marker, op) {
    const pos1 = op.pos
    const length = op.str.length
    const pos2 = pos1 + length
    if (pos1 === pos2) return
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
  }

  _remove (marker) {
    this.removeMarker(marker)
  }
}

class MarkersIndex {
  add (path, val) {
    const key = getKeyForPath(path)
    if (!this[key]) {
      this[key] = []
    }
    this[key].push(val)
  }

  remove (path, val) {
    const key = getKeyForPath(path)
    if (this[key]) {
      deleteFromArray(this[key], val)
    }
  }

  get (path) {
    const key = getKeyForPath(path)
    return this[key] || []
  }

  clearMarkers (path, filter) {
    const key = getKeyForPath(path)
    const arr = this[key]
    if (arr) {
      for (let i = arr.length - 1; i >= 0; i--) {
        if (filter(arr[i])) {
          arr.splice(i, 1)
        }
      }
    }
  }
}
