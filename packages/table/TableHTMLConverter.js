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

        // Add null values for colspans
        if (tableCell.colspan > 1) {
          Array(tableCell.colspan - 1).forEach(() => {
            row.push(null)
          })
        }
      }
      cells.push(row)
    }
    node.cells = cells
  },

  export: function(/*node, el, converter*/) {
    console.error('TableHTMLConverter.export is not implemented')
  }
}
