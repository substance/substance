import { DocumentNode, PLAIN_TEXT } from 'substance'

export default class TestMetaNode extends DocumentNode {}

TestMetaNode.schema = {
  type: 'meta',
  title: PLAIN_TEXT
}
