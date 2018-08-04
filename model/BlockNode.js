import DocumentNode from './DocumentNode'

export default class BlockNode extends DocumentNode {
  static get isBlock () { return true }
}
