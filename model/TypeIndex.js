import NodeIndex from './NodeIndex'
import { TreeIndex } from '../util'

export default class TypeIndex extends NodeIndex {
  constructor (property) {
    super()

    this.byType = new TreeIndex.Arrays()
  }

  get (type) {
    return this.byType.get(type) || []
  }

  clear () {
    this.byType.clear()
  }

  select(node) { // eslint-disable-line
    return true
  }

  create (node) {
    const type = node.type
    this.byType.add([type], node)
  }

  delete (node) {
    const type = node.type
    this.byType.delete([type], node)
  }

  update () {
    // type can not be updated
    return false
  }

  _initialize (data) {
    const nodes = data.getNodes().values()
    for (const node of nodes) {
      if (this.select(node)) {
        this.create(node)
      }
    }
  }
}
