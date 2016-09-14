import Registry from '../../util/Registry'
import ParagraphComponent from '../../packages/paragraph/ParagraphComponent'
import HeadingComponent from '../../packages/heading/HeadingComponent'
import TestContainerComponent from './TestContainerComponent'
import TestStructuredNodeComponent from './TestStructuredNodeComponent'
import InlineWrapperComponent from '../../packages/inline-wrapper/InlineWrapperComponent'

export default function createTestComponentRegistry() {
  var componentRegistry = new Registry()
  componentRegistry.add('paragraph', ParagraphComponent)
  componentRegistry.add('heading', HeadingComponent)
  componentRegistry.add('container', TestContainerComponent)
  componentRegistry.add('structured-node', TestStructuredNodeComponent)
  componentRegistry.add('inline-wrapper', InlineWrapperComponent)
  return componentRegistry
}
