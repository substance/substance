import times from '../../util/times'

export default {

  type: 'table',
  tagName: 'table',

  /*
    WARNING: This includes a pretty naive implementation for considering
    rowspans and colspans.

    TODO: Create test suite for this converter
  */
  import: function(el, node, converter) {
    let trs = el.find('tbody').getChildren()
    let colCount = 0
    let cells = []
    let rowspans = [] // we remember active rowspans here
    for (let i = 0; i < trs.length; i++) {
      let tds = trs[i].getChildren()
      let row = []
      colCount = Math.max(tds.length, colCount)
      for (let j = 0; j < tds.length; j++) {
        let td = tds[j]
        // if there is an open rowspan
        if (rowspans[j] > 1) {
          row.push(null)
          rowspans[j] -= 1 // count down until exhausted
        }
        let tableCell = converter.convertElement(td)
        row.push(tableCell.id)
        if (tableCell.rowspan > 1) {
          rowspans[j] = tableCell.rowspan
        }
        if (tableCell.colspan > 1) {
          // Add null values for colspans
          times(tableCell.colspan - 1, () => {
            row.push(null)
          })
        }
      }
      cells.push(row)
    }
    node.cells = cells
  },

  export: function(node, el, converter) {
    let $$ = converter.$$
    let rowCount = node.getRowCount()
    let colCount = node.getColCount()
    for (let i = 0; i < rowCount; i++) {
      let rowEl = $$('tr')
      for (let j = 0; j < colCount; j++) {
        let cellId = node.cells[i][j]
        // Merged cells (cellId is null) are skipped
        if (cellId) {
          let cellEl = converter.convertNode(cellId)
          rowEl.append(cellEl)
        }
      }
      el.append(rowEl)
    }
    return el
  }
}
