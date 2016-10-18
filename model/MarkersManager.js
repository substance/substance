import TreeIndex from '../util/TreeIndex'

/*
  A dynamic extension to Document Annotations.

  Using the same mechanism to render, Markers are not part of the persisted model
  but used to attach informations to the text dynamically.

  For example, a spell-checker can highlight misspelled words and store suggestions.
*/
class MarkersManager {

  constructor(doc) {
    this.doc = doc
    // markers stored via path and key into arrays
    this._markers = new TreeIndex.Arrays()
  }

  set(path, key, markers) {
    this._markers.set(path.concat(key), markers)
    this.doc.emit('markers:set', key, path, markers)
  }

  add(path, key, marker) {
    // HACK: storing the key into the marker
    marker._key = key
    this._markers.add(path.concat(key), marker)
    this.doc.emit('markers:added', key, path, marker)
  }

  remove(path, key) {
    this._markers.remove(path.concat(key))
    this.doc.emit('markers:removed', key, path)
  }

  _removeMarker(marker) {
    let key = marker._key
    let path = marker.path
    this._markers.remove(path.concat(key), marker)
    this.doc.emit('markers:removed', key, path)
  }

  get(path) {
    return this._markers.getAll(path)
  }

  getMarkersForSelection(sel) {
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

  _onDocumentChange(change) {
    let doc = this.doc
    // TODO: we need to update markers, properly. They are not part of the model and need to be moved, expanded, deleted here according
    // to incoming changes
    change.ops.forEach((op) => {
      let markers = this.get(op.path)
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
