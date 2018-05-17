import Schema from './Schema'
import DocumentNode from './DocumentNode'
import Container from './Container'
import PropertyAnnotation from './PropertyAnnotation'
import ContainerAnnotation from './ContainerAnnotation'

export default class DocumentSchema extends Schema {
  constructor (schemaSpec) {
    super(schemaSpec.name, schemaSpec.version)
    /* istanbul ignore next */
    if (!schemaSpec.DocumentClass) {
      throw new Error('DocumentClass is mandatory')
    }
    Object.assign(this, schemaSpec)
  }

  getDocumentClass () {
    return this.DocumentClass
  }

  /*
    @override
  */
  getDefaultTextType () {
    return this.defaultTextType
  }

  /*
    @override
  */
  getBuiltIns () {
    return [DocumentNode, PropertyAnnotation, Container, ContainerAnnotation]
  }
}
