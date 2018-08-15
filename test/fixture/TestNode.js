import { DocumentNode } from 'substance'

export default class TestNode extends DocumentNode {
  static isBlock () { return true }
}

TestNode.schema = {
  type: 'test-node',
  boolVal: { type: 'boolean', default: false },
  stringVal: { type: 'string', default: '' },
  arrayVal: { type: ['array', 'string'], default: [] },
  objectVal: { type: 'object', default: {} }
}
