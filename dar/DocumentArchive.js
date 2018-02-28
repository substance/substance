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
    return this.getEditorSession('manifest').getDocument().getDocumentEntries()
  }

  getEditorSession(docId) {
    return this.sessions[docId]
  }


}
