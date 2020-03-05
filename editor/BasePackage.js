import AnnotationComponent from './AnnotationComponent'
import IsolatedNodeComponent from './IsolatedNodeComponent'
import IsolatedInlineNodeComponent from './IsolatedInlineNodeComponent'
import TextPropertyComponent from './TextPropertyComponent'
import TextPropertyEditor from './TextPropertyEditor'
import TextNodeComponent from './TextNodeComponent'
import UnsupportedNodeComponent from './UnsupportedNodeComponent'

export default {
  configure (config) {
    config.addComponent('annotation', AnnotationComponent)
    config.addComponent('inline-node', IsolatedInlineNodeComponent)
    config.addComponent('isolated-node', IsolatedNodeComponent)
    config.addComponent('text-node', TextNodeComponent)
    config.addComponent('text-property', TextPropertyComponent)
    config.addComponent('text-property-editor', TextPropertyEditor)
    config.addComponent('unsupported-node', UnsupportedNodeComponent)
  }
}
