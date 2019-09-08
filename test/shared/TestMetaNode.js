import { DocumentNode, PLAIN_TEXT } from 'substance'

export default class TestMetaNode extends DocumentNode {
  define () {
    return {
      type: 'meta',
      title: PLAIN_TEXT
    }
  }
}
