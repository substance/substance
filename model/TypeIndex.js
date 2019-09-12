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
    let type = node.type
    this.byType.add([type], node)
  }

  delete (node) {
    let type = node.type
    this.byType.delete([type], node)
  }

  update () {
    // type can not be updated
    return false
  }

  _initialize (data) {
    let nodes = data.getNodes().values()
    for (let node of nodes) {
      if (this.select(node)) {
        this.create(node)
      }
    }
  }
}
