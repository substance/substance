import ManifestDocument from './ManifestDocument'

export default {
  load (manifestXml) {
    return ManifestDocument.fromXML(manifestXml)
  }
}
