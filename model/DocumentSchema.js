import Schema from './Schema'
import DocumentNode from './DocumentNode'
import Container from './Container'
import PropertyAnnotation from './PropertyAnnotation'
import ContainerAnnotation from './ContainerAnnotation'

class DocumentSchema extends Schema {

  constructor({ name, DocumentClass, defaultTextType='text', version='0.0.0' }) {
    super(name, version)

    /* istanbul ignore next */
    if (!DocumentClass) {
      throw new Error('DocumentClass is mandatory')
    }

    this.DocumentClass = DocumentClass
    this.defaultTextType = defaultTextType
  }

  getDocumentClass() {
    return this.DocumentClass
  }

  /*
    @override
  */
  getDefaultTextType() {
    return this.defaultTextType
  }

  /*
    @override
  */
  getBuiltIns() {
    return [DocumentNode, PropertyAnnotation, Container, ContainerAnnotation]
  }

}

export default DocumentSchema
