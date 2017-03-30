import {
  DocumentSchema as Schema,
  ParagraphPackage, HeadingPackage, EmphasisPackage, StrongPackage,
  LinkPackage, ImagePackage, CodeblockPackage, ListPackage,
  InlineWrapperPackage
} from 'substance'

import MetaNode from './TestMetaNode'
import TestNode from './TestNode'
import TestContainerAnnotation from './TestContainerAnnotation'
import TestStructuredNode from './TestStructuredNode'

const Paragraph = ParagraphPackage.Paragraph
const Heading = HeadingPackage.Heading
const Strong = StrongPackage.Strong
const Emphasis = EmphasisPackage.Emphasis
const Link = LinkPackage.Link
const ImageNode = ImagePackage.ImageNode
const Codeblock = CodeblockPackage.Codeblock
const List = ListPackage.ListNode
const ListItem = ListPackage.ListItemNode
const InlineWrapper = InlineWrapperPackage.InlineWrapper

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
  List, ListItem,
  TestNode,
  TestContainerAnnotation,
  TestStructuredNode,
  InlineWrapper
])

export default schema
