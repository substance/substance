import { DocumentNode } from 'substance'

export default class TestBlockNode extends DocumentNode {
  define () {
    return {
      type: 'test-block'
    }
  }
}
