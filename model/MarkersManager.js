import uniq from 'lodash/uniq'
import map from '../util/map'
import forEach from '../util/forEach'
import deleteFromArray from '../util/deleteFromArray'

/*

*/
class MarkersManager {

  constructor(editorSession) {
    this.editorSession = editorSession

    let doc = editorSession.getDocument()
    this._annos = doc.getIndex('annotations')
    this._markers = doc.getIndex('markers')

    // registry
    this._configs = {}
    this._textProperties = {}
    this._dirtyProps = {}


    // cached data
    this._documentMarkers = {}
    this._surfaceMarkers = {}
    this._containerMarkers = {}

    editorSession.onUpdate('document', this._onDocumentChange, this)
    editorSession.onRender(this._updateProperties, this)
  }

  dispose() {
    this.editorSession.off(this)
  }

  register(textProperyComponent) {
    let path = String(textProperyComponent.getRealPath())
    // console.log('registering property', path)
    // register the component via path
    let textProperties = this._textProperties[path]
    if (!textProperties) {
      textProperties = this._textProperties[path] = []
    }
    textProperties.push(textProperyComponent)
    this._updateRegistration(path)
    this._initialFetch(path, textProperyComponent.getSurfaceId(), textProperyComponent.getContainerId())
  }

  deregister(textProperyComponent) {
    let path = String(textProperyComponent.getRealPath())
    deleteFromArray(this._textProperties[path], textProperyComponent)
    this._updateRegistration(path)
  }

  getMarkers(path, opts) {
    opts = opts || {}
    return this._getMarkers(path, opts.surfaceId, opts.containerId)
  }

  setMarkers(path, type, markers) {
    let pathStr = String(path)
    let doc = this.editorSession.getDocument()
    // remove the old ones first
    var oldMarkers = map(doc.getIndex('markers').get(path)) || []
    oldMarkers.forEach(function(m) {
      if (m.type === type) {
        // console.log('### removing marker')
        m.remove()
      }
    })
    // then create new ones
    markers.forEach(function(m) {
      doc.create(m)
    })
    this._fetchDocumentMarkers(pathStr)
    this._dirtyProps[pathStr] = true
    this.editorSession.startFlow()
  }

  _updateRegistration(path) {
    let textProperties = this._textProperties[path]
    let config = { containerIds: [], surfaceIds: []}
    if (textProperties.length === 0) {
      // TODO: stop watching
      delete this._documentMarkers[path]
      delete this._surfaceMarkers[path]
      delete this._containerMarkers[path]
      delete this._textProperties[path]
      delete this._configs[path]
    } else {
      for (var i = 0; i < textProperties.length; i++) {
        let textProperty = textProperties[i]
        let surfaceId = textProperty.getSurfaceId()
        let containerId = textProperty.getContainerId()
        if (surfaceId) {
          config.surfaceIds.push(surfaceId)
        }
        if (containerId) {
          config.containerIds.push(containerId)
        }
      }
      config.containerIds = uniq(config.containerIds)
      config.surfaceIds = uniq(config.surfaceIds)
      this._configs[path] = config
    }
  }

  _getMarkers(path, surfaceId, containerId) {
    let markers = this._documentMarkers[path] || []
    if (surfaceId) {
      let surfaceMarkers = this._surfaceMarkers[String([surfaceId].concat(path))]
      if (surfaceMarkers) markers = markers.concat(surfaceMarkers)
    }
    if (containerId) {
      let containerMarkers = this._containerMarkers[String([containerId].concat(path))]
      if (containerMarkers) markers = markers.concat(containerMarkers)
    }
    return markers
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

  _fetchDocumentMarkers(pathStr) {
    let path = pathStr.split(',')
    let documentMarkers = []
    let annos = map(this._annos.get(path)) || []
    if (annos) {
      documentMarkers = documentMarkers.concat(annos)
    }
    let markers = map(this._markers.get(path)) || []
    if (markers) {
      documentMarkers = documentMarkers.concat(markers)
    }
    // console.log('## fetched documentMarkers for %s', pathStr, documentMarkers)
    this._documentMarkers[pathStr] = documentMarkers
    return documentMarkers
  }

  _fetchSurfaceMarkers(path, surfaceId) {
    // TODO: implement this to bring back
    let surfaceMarkers = []
    this._surfaceMarkers[String([surfaceId].concat(path))] = surfaceMarkers
    return surfaceMarkers
  }

  _fetchContainerMarkers(path, containerId) {
    let containerMarkers = [String([containerId].concat(path))]
    this._containerMarkers[path] = containerMarkers
    return containerMarkers
  }

  _onDocumentChange(change) {
    // update document markers
    this._transformMarkers(change)
    // fetch all document markers
    forEach(change.updated, (val, id) => {
      this._fetchDocumentMarkers(id)
      this._dirtyProps[id] = true
    })
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
    let path = textPropertyComponent.getRealPath()
    let markers = this._getMarkers(path, textPropertyComponent.getSurfaceId(), textPropertyComponent.getContainerId())
    // console.log('## providing %s markers for %s', markers.length, path)
    textPropertyComponent.setState({
      markers: markers
    })
  }

  // for every observed path we need to transform markers
  // at least certain markers
  _transformMarkers(change) {
    let doc = this.doc
    // TODO: we need to update markers, properly. They are not part of the model and need to be moved, expanded, deleted here according
    // to incoming changes
    change.ops.forEach((op) => {
      let markers = map(this._markers.get(op.path)) || []
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
          marker.remove()
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
