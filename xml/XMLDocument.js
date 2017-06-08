import {
  IncrementalData, Document,
  PropertyIndex, AnnotationIndex,
  DocumentNodeFactory
} from '../model'

import ParentNodeHook from './ParentNodeHook'

export default
class XMLDocument extends Document {

  _initialize() {
    this.nodeFactory = new DocumentNodeFactory(this)
    this.data = new IncrementalData(this.schema, this.nodeFactory)
    // all by type
    this.addIndex('type', new PropertyIndex('type'))
    // special index for (property-scoped) annotations
    this.addIndex('annotations', new AnnotationIndex())

    ParentNodeHook.register(this)
  }

  getXMLSchema() {
    // XMLDocument should have an XMLSchema instance which
    // is provided here
    throw new Error('Not implemented yet')
  }
}