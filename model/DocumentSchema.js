import Schema from './data/Schema'
import DocumentNode from './DocumentNode'
import Container from './Container'
import PropertyAnnotation from './PropertyAnnotation'
import ContainerAnnotation from './ContainerAnnotation'

/**
  Used to define custom article formats. Predefined node types can be combined with custom ones.

  @class
  @param {String} name schema identifier
  @param {String} schema schema version

  @example

  ```js
  import Paragraph from 'substance/packages/paragraph/Paragraph'
  import Emphasis from 'substance/packages/emphasis/Emphasis'
  import Strong from 'substance/packages/emphasis/Strong'
  import PropertyAnnotation from 'substance/ui/PropertyAnnotation'

  var Comment = PropertyAnnotation.extend({
    name: 'comment',
    properties: {
      content: 'string'
    }
  })

  var schema = new Document.Schema('my-article', '1.0.0')
  schema.getDefaultTextType = function() {
    return 'paragraph'
  }
  schema.addNodes([Paragraph, Emphasis, Strong, Comment])
  ```
*/

class DocumentSchema extends Schema {

  /**
    Returns default text type. E.g. used when hitting ENTER in a text node, which
    produces a new node of the type returned here. Abstract method, which must be implemented.

    @abstract
    @returns {String} default text type (e.g. 'paragraph')
  */

  getDefaultTextType() {
    throw new Error('DocumentSchema.getDefaultTextType() is abstract and must be overridden.')
  }

  isAnnotationType(type) {
    var nodeClass = this.getNodeClass(type)
    return (nodeClass && nodeClass.prototype._isPropertyAnnotation)
  }

  getBuiltIns() {
    return [DocumentNode, PropertyAnnotation, Container, ContainerAnnotation]
  }

}

export default DocumentSchema
