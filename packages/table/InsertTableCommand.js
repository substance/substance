import InsertNodeCommand from '../../ui/InsertNodeCommand'
import uuid from '../../util/uuid'

class InsertTableCommand extends InsertNodeCommand {
  constructor() {
    super({ name: 'insert-table' })
  }

  createNodeData(tx, args) { // eslint-disable-line
    // TODO: make this configurable, e.g. via args
    let nrows = 5
    let ncols = 6
    let cells = []

    for (let i = 0; i < nrows; i++) {
      let cols = []
      for (let j = 0; j < ncols; j++) {
        let node = tx.create({id: uuid(), type: 'paragraph', content: ''})
        cols.push({content: node.id})
      }


      cells.push(cols)
    }

    return {
      type: 'table',
      cells: cells
    }
  }

}

export default InsertTableCommand
