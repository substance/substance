import BlockNode from '../../model/BlockNode'

class Table extends BlockNode {

  getRowCount() {
    return this.cells.length
  }

  getColCount() {
    if (this.cells.length > 0) {
      return this.cells[0].length
    } else {
      return 0
    }
  }
}

Table.schema = {
  type: 'table',
  cells: { type: ['array', 'array', 'id'], default: [] }
}

export default Table
