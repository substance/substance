import { Registry, ParagraphPackage, HeadingPackage, InlineWrapperPackage } from 'substance'
import TestContainerComponent from './TestContainerComponent'
import TestStructuredNodeComponent from './TestStructuredNodeComponent'

const ParagraphComponent = ParagraphPackage.ParagraphComponent
const HeadingComponent = HeadingPackage.HeadingComponent
const InlineWrapperComponent = InlineWrapperPackage.InlineWrapperComponent

export default function createTestComponentRegistry () {
  var componentRegistry = new Registry()
  componentRegistry.add('paragraph', ParagraphComponent)
  componentRegistry.add('heading', HeadingComponent)
  componentRegistry.add('container', TestContainerComponent)
  componentRegistry.add('structured-node', TestStructuredNodeComponent)
  componentRegistry.add('inline-wrapper', InlineWrapperComponent)
  return componentRegistry
}
