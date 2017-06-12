import {
  IncrementalData, Document,
  PropertyIndex, AnnotationIndex,
  DocumentNodeFactory
} from '../model'

import ParentNodeHook from './ParentNodeHook'
import XMLEditingInterface from './XMLEditingInterface'

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
    // should provide an XMLSchema instance
    throw new Error('This method is abstract')
  }

  getRootNode() {
    // should provide the root-element
    throw new Error('This method is abstract')
  }

  createEditingInterface() {
    return new XMLEditingInterface(this)
  }
}