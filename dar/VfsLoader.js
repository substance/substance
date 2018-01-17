import loadManifest from './loadManifest'
import DocumentArchive from './DocumentArchive'

const path = {
  join(p1, p2) { return p1+'/'+p2 }
}

export default class VfsLoader {

  constructor(vfs, loaders) {
    this.vfs = vfs
    this.loaders = loaders
  }

  load(rdcUri) {
    const vfs = this.vfs
    return new Promise((resolve, reject) => {
      let manifestPath = path.join(rdcUri, 'manifest.xml')
      let manifestXml
      try {
        manifestXml = vfs.readFileSync(manifestPath)
      } catch (err) {
        return reject(err)
      }
      let manifest, manifestEditorSession
      try {
        let {editorSession} = loadManifest(manifestXml)
        manifest = editorSession.getDocument()
        manifestEditorSession = editorSession
      } catch (err) {
        return reject(err)
      }
      let sessions = {}
      sessions['manifest'] = manifestEditorSession
      manifest.findAll('container > documents > document').forEach((el) => {
        let session
        session = this._loadDocument(rdcUri, el)
        sessions[el.id] = session
      })
      let dc = new DocumentArchive(sessions)
      resolve(dc)
    })
  }

  _loadDocument(rdcUri, el) {
    const vfs = this.vfs
    const type = el.attr('type')
    const relPath = el.attr('path')
    let uri = path.join(rdcUri, relPath)
    let content = vfs.readFileSync(uri)
    let loader = this.loaders[type]
    return loader.load(content)
  }

}
