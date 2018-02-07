export default class DocumentArchive {

  constructor(sessions, buffer) {
    this.sessions = sessions
    this.buffer = buffer

    if (!sessions.manifest) throw new Error("'manifest' session is required.")

    this.init()
  }

  init() {
    // register listeners for every session

  }

  getManifest() {
    return this.sessions.manifest.getDocument()
  }

  getDocumentEntries() {
    const manifest = this.getManifest()
    let docs = manifest.findAll('container > documents > document')
    return docs.map(d => {
      return {
        id: d.id || d.attr('path'),
        type: d.attr('type'),
        path: d.attr('path'),
        name: d.attr('name')
      }
    })
  }

  getEditorSession(docId) {
    return this.sessions[docId]
  }


}
