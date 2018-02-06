import Configurator from '../ui/Configurator'
import EditorSession from '../ui/EditorSession'
import registerSchema from '../xml/registerSchema'
import XMLDocumentImporter from '../xml/XMLDocumentImporter'
import ManifestSchema from './ManifestSchema'
import ManifestDocument from './ManifestDocument'

export default function loadManifest(xmlStr) {
  let configurator = new Configurator()
  registerSchema(configurator, ManifestSchema, ManifestDocument, {
    ImporterClass: XMLDocumentImporter
  })
  let importer = configurator.createImporter(ManifestSchema.getName())
  let manifest = importer.importDocument(xmlStr)
  let editorSession = new EditorSession(manifest, { configurator })
  return editorSession
}
