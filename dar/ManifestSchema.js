import XMLSchema from '../xml/XMLSchema'
import ManifestSchemaData from '../tmp/Manifest.data.js'

const ManifestSchema = XMLSchema.fromJSON(ManifestSchemaData)

// TODO: this should come from compilation
ManifestSchema.getName = function() {
  return 'RDC-Manifest'
}

ManifestSchema.getVersion = function() {
  return '1.0'
}

ManifestSchema.getDocTypeParams = function() {
  return ['manifest', 'RDC-Manifest 1.0', ManifestSchema.uri]
}

// TODO: this does not make sense
ManifestSchema.getDefaultTextType = function () {
  return 'text'
}

ManifestSchema.uri = '//Manifest-1.0.dtd'

export default ManifestSchema
