/*
  - feeds markers into flow
  - provides API to check if current selection has markers
  TODO: to be able to evaluate the current state of
*/
class MarkersFlowAdapter {

  constructor(flow, documentSession) {
    this.flow = flow
    this.doc = documentSession.getDocument()
    this.docId = this.doc.id

    this.doc.on('markers:set', this._onMarkersSet, this)
    this.doc.on('markers:removed', this._onMarkersRemoved, this)
  }

  dispose() {
    this.doc.off(this)
  }

  /*
    spellcheck use case:
    for each paragraph markers might be set individually
    i.e., also renewed on a paragraph basis
    key: e.g. 'spellcheck'
    path: ['text1', 'content']
    markers: [Marker1, Marker2]
  */
  _onMarkersSet(key, path, markers) {
    const docId = this.docId
    const flow = this.flow
    flow.setValue([docId, 'markers', path], key, markers)
    flow.start()
  }

  _onMarkersRemoved(key, paths) {
    const docId = this.docId
    const flow = this.flow
    paths.forEach(function(path) {
      flow.setValue([docId, 'markers', path], key, [])
    })
    flow.start()
  }
}

export default MarkersFlowAdapter
