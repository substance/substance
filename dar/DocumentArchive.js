export default class DocumentArchive {

  constructor(sessions) {
    this.sessions = sessions
    if (!sessions.manifest) throw new Error("'manifest' session is required.")
  }

  getManifest() {
    return this.sessions.manifest.getDocument()
  }

  getDocumentEntries() {
    const manifest = this.getManifest()
    let docs = manifest.findAll('container > documents > document')
    return docs.map(d => {
      return {
        id: d.id,
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
