import {
  DocumentSchema as Schema,
  ParagraphPackage, HeadingPackage, EmphasisPackage, StrongPackage,
  LinkPackage, ImagePackage, CodeblockPackage, ListPackage,
  InlineWrapperPackage,
  Container
} from 'substance'

import Body from './TestBody'
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

export default new Schema({
  nodes: [
    MetaNode,
    Body,
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
  ]
})
