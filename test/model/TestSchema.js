import Schema from '../../model/DocumentSchema'
import MetaNode from './TestMetaNode'
import TestNode from './TestNode'
import TestContainerAnnotation from './TestContainerAnnotation'
import TestStructuredNode from './TestStructuredNode'
import Paragraph from '../../packages/paragraph/Paragraph'
import Heading from '../../packages/heading/Heading'
import Emphasis from '../../packages/emphasis/Emphasis'
import Strong from '../../packages/strong/Strong'
import Link from '../../packages/link/Link'
import ImageNode from '../../packages/image/ImageNode'
import Codeblock from '../../packages/codeblock/Codeblock'
import InlineWrapper from '../../packages/inline-wrapper/InlineWrapper'

var schema = new Schema("test-article", "1.0.0")

schema.getDefaultTextType = function() {
  return 'paragraph'
}

schema.addNodes([
  MetaNode,
  Paragraph,
  Heading,
  Emphasis,
  Strong,
  Link,
  ImageNode,
  Codeblock,
  TestNode,
  TestContainerAnnotation,
  TestStructuredNode,
  InlineWrapper
])

export default schema
