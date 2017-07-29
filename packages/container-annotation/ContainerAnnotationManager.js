import { Marker } from '../../model'

class ContainerAnnotationManager {

  constructor(context) {
    if (!context.editorSession) {
      throw new Error('EditorSession required.')
    }

    this.editorSession = context.editorSession
    this.editorSession.onRender('document', this._onDocumentChanged, this)

    this.doc = this.editorSession.getDocument()
    this.context = Object.assign({}, context, {
      // for convenienve we provide access to the doc directly
      doc: this.doc
    })

    this._state = {
      annotations: [],
    }

    this._containerFragments = {}

    this.initialize()
  }

  dispose() {
    this.editorSession.off(this)
  }

  initialize() {
    this._computeAnnotations()
    this._updateAnnotations()
    // HACK: we make commandStates dirty in order to trigger re-evaluation
    this.editorSession._setDirty('commandStates')
    this.editorSession.startFlow()
  }

  getAnnotationFragments(annoId) {
    return this._containerFragments[annoId]
  }

  _onDocumentChanged() {
    this._computeAnnotations()
    this._updateAnnotations()
  }

  _computeAnnotations() {
    let containerAnnotationIndex = this.doc.getIndex('container-annotations')
    let annos = []
    let containers = Object.keys(containerAnnotationIndex.annosById)

    containers.forEach(containerId => {
      let annotations = Object.keys(containerAnnotationIndex.annosById[containerId])
      annotations.forEach(annoId => {
        const container = this.doc.get(containerId, 'strict')
        const anno = this.doc.get(annoId)
        const startPos = container.getPosition(anno.start.path[0])
        const endPos = container.getPosition(anno.end.path[0])

        let fragments = []
        // NOTE: for now we only create fragments for spanned TextNodes
        // TODO: support list items
        for (let i = startPos; i <= endPos; i++) {
          let node = container.getChildAt(i)
          if (!node.isText()) continue
          const path = node.getTextPath()
          let fragment = new Marker(this.doc, {
            type: 'container-annotation-fragment',
            scope: 'container',
            containerId: containerId,
            anno: anno,
            id: annoId,
            start: { path: path, offset: 0 },
            end: { path: path, offset: node.getLength() + 1 }
          })
          if (i === startPos) {
            fragment.start = anno.start
            fragment.isFirst = true
          }
          if (i === endPos) {
            fragment.end = anno.end
            fragment.isLast = true
          }
          //fragment = new Marker(this.doc, fragment)

          fragments.push(fragment)
          annos.push(fragment)
        }

        this._containerFragments[anno.id] = fragments
      })
    })
    this._state.annotations = annos
  }

  _updateAnnotations() {
    const state = this._state
    const editorSession = this.editorSession
    const markersManager = editorSession.markersManager
    // state.annotations.forEach((m, idx) => {
    //   m.type = (idx === state.selected) ? 'selected-match' : 'match'
    // })
    //console.log('setting container-annotations markers', state.annotations)
    markersManager.setMarkers('container-annotations', state.annotations)
  }

}

export default ContainerAnnotationManager
