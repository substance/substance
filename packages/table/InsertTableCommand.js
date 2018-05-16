import uuid from '../../util/uuid'
import InsertNodeCommand from '../../ui/InsertNodeCommand'

class InsertTableCommand extends InsertNodeCommand {
  createNodeData (tx) {
    // row-1
    let a1 = tx.create({ id: uuid('table-cell'), type: 'table-cell', content: 'A1' })
    let b1 = tx.create({ id: uuid('table-cell'), type: 'table-cell', content: 'B1' })
    // row-2
    let a2 = tx.create({ id: uuid('table-cell'), type: 'table-cell', content: 'A2' })
    let b2 = tx.create({ id: uuid('table-cell'), type: 'table-cell', content: 'B2' })

    return {
      id: uuid('table'),
      type: 'table',
      // null values mark merged cells
      cells: [
        [a1.id, b1.id],
        [a2.id, b2.id]
      ]
    }
  }
}

export default InsertTableCommand
