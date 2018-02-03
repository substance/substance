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

  getCellAt(row, col) {
    let cellId = this.cells[row][col]
    if (cellId) {
      return this.document.get(cellId)
    }
  }

}

Table.schema = {
  type: 'table',
  cells: { type: ['array', 'array', 'id'], default: [], owned: true }
}

export default Table
