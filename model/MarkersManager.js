import forEach from '../util/forEach'
import deleteFromArray from '../util/deleteFromArray'
import MarkersIndex from './MarkersIndex'

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
    // Note: from a rendering point of view, we take annotations and custom markers (such as spell errors)
    // and create markers (which are bound to one property) and dispatch them the respective TextPropertyComponents
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

export default MarkersManager
