import { Marker } from '../../model'

/*
  This class maintains a set of Markers (see MarkersManager)
  where each marker represents a fragment of a ContainerAnnotation.

  It needs to react on DocumentChanges whenever:
  - a ContainerAnnotation has been created, deleted,
    or updated
  - a node has been inserted or removed from a container
    being covered by ContainerAnnotation

  TODO: find out if this requirement description is complete

  > We should discuss, if it might be helpful to restrict ourselves
    to a set of manipulations (document changes) with a specific
    meaning, such as 'insert-text', 'delete-text', 'break', 'insert-node'
    Particularly, it could be handy to understand, when a container is changed.
*/
export default class ContainerAnnotationManager {

  constructor(context) {
    if (!context.editorSession) {
      throw new Error('EditorSession required.')
    }
    this.editorSession = context.editorSession
    this.editorSession.onUpdate('document', this._onDocumentChanged, this)

    this.doc = this.editorSession.getDocument()
    // TODO: we should be careful with introducing
    // a lot of different scopes called 'context'
    this.context = Object.assign({}, context, {
      // for convenienve we provide access to the doc directly
      doc: this.doc
    })

    // FIXME: the names are not intuitive
    // - 'annotations' is used to detect changes on
    //   properties that contain a fragment
    // - 'containerFragments' is used to maintain all fragments (=markers)
    //   for a containerAnnotation
    this._state = {
      annotations: {},
      containerFragments: {}
    }
    this.initialize()
  }

  dispose() {
    this.editorSession.off(this)
  }

  initialize() {
    this._computeAnnotations()
    this._createAnnotations()
    // FIXME: I don't thing that this should be necessary
    // if the ContainerAnnotationManager is setup at the
    // the right time, i.e. before rendering the editor
    // HACK: we make commandStates dirty in order to trigger re-evaluation
    this.editorSession._setDirty('commandStates')
    this.editorSession.startFlow()
  }

  getAnnotationFragments(annoId) {
    return this._state.containerFragments[annoId]
  }

  /*
    FIXME: this needs to be implemented properly
    - should not rely on hard-coded container (`doc.get('body')`)
    - should somehow reflect a general strategy as in the class description

    TODO:
    - try to complement the requirement description started in the class header
    - try find a reasonable implementation of the description
    - maintain an explanation of the taken approach here, so that
      it is easier to understand and verify the implementation in future
  */
  _onDocumentChanged(change) {
    let dirtyNodes = []
    let shouldUpdate = false

    // For now we will run recomputation after any node creation
    if(Object.keys(change.created).length > 0) shouldUpdate = true

    // We will collect ids of updated nodes to update markers there
    let updated = Object.keys(change.updated)
    updated.forEach(prop => {
      let nodeId = prop.split(',')[0]
      let node = this.doc.get(nodeId)
      if(node && node.isText()) {
        if(dirtyNodes.indexOf(nodeId) === -1) {
          dirtyNodes.push(nodeId)
          // We will run recomputation and update if node with
          // conntainer annotation got updated
          if(this._state.annotations[nodeId]) shouldUpdate = true
        }
      }
    })

    // Compute range for created/removed annos
    if(dirtyNodes.length === 2) {
      // TODO: We should get container via API
      const container = this.doc.get('body')
      const startPos = container.getPosition(dirtyNodes[0])
      const endPos = container.getPosition(dirtyNodes[1])
      let nodeIds = container.getContent().slice(startPos+1, endPos)
      dirtyNodes = dirtyNodes.concat(nodeIds)
    }

    if(shouldUpdate) {
      this._computeAnnotations()
      dirtyNodes.forEach(nodeId => {
        this._updateAnnotations(nodeId)
      })
    }
  }

  /*
    Compute markers for every containerAnnotation,
    i.e. a fragment for each spanned TextProperty.

    ATM, we call this method whenever there is a change
    that could have an effect on ContainerAnnotation rendering.
  */
  _computeAnnotations() {
    let containerAnnotationIndex = this.doc.getIndex('container-annotations')
    let containerIds = containerAnnotationIndex.getContainerIds()

    let fragmentsByAnno = {}
    let fragmentsByTarget = {}
    containerIds.forEach(containerId => {
      let annotationIds = containerAnnotationIndex.getAnnotationIdsForContainerId(containerId)
      annotationIds.forEach(annoId => {
        let fragments = this._createContainerAnnotationFragments(this.doc.get(annoId))
        fragmentsByAnno[annoId] = fragments
        fragments.forEach((fragment) => {
          const path = fragment.path
          // FIXME: it is not necessary to detect any changes to
          // nodes with container annos. Instead we should
          // use the whole path here
          const targetId = path[0]
          let targetFragments = fragmentsByTarget[targetId]
          if (!targetFragments) {
            targetFragments = fragmentsByTarget[targetId] = []
          }
          targetFragments.push(fragment)
        })
      })
    })
    // FIXME: better naming
    this._state.containerFragments = fragmentsByAnno
    this._state.annotations = fragmentsByTarget
  }

  _createAnnotations() {
    const state = this._state
    let annotations = state.annotations
    let nodes = Object.keys(annotations)
    nodes.forEach(nodeId => {
      this._updateAnnotations(nodeId)
    })
  }

  _updateAnnotations(nodeId) {
    const editorSession = this.editorSession
    const markersManager = editorSession.markersManager
    const state = this._state
    let annotations = state.annotations
    let nodeAnnotations = annotations[nodeId]
    if(nodeAnnotations) {
      markersManager.setMarkers('container-annotations:' + nodeId, nodeAnnotations)
    } else {
      markersManager.clearMarkers('container-annotations:' + nodeId)
    }
  }

  _createContainerAnnotationFragments(anno) {
    const container = anno.getContainer()
    const containerId = container.id
    const startPos = container.getPosition(anno.start.path[0])
    const endPos = container.getPosition(anno.end.path[0])
    // this should not happen
    if (startPos === -1 || endPos === -1) {
      console.error('FIXME: ContainerAnnotation "%s" has invalid coordinates.', anno.id)
      return []
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
        scope: 'container',
        containerId: containerId,
        anno: anno,
        id: anno.id,
        start: { path: path, offset: 0 },
        end: { path: path, offset: node.getLength() + 1 }
      }
      if (i === startPos) {
        fragment.start = anno.start
        fragment.isFirst = true
      }
      if (i === endPos) {
        fragment.end = anno.end
        fragment.isLast = true
      }
      fragments.push(new Marker(this.doc, fragment))
    }
    return fragments
  }

}