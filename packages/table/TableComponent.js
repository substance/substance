import Component from '../../ui/Component'
import TableCellComponent from './TableCellComponent'

class TableComponent extends Component {

  render($$) {
    let el = $$('table').addClass('sc-table')
    let node = this.props.node
    let doc = this.props.node.getDocument()
    let cells = this.props.node.cells
    let rowCount = node.getRowCount()
    let colCount = node.getColCount()
    for (let i = 0; i < rowCount; i++) {
      let rowEl = $$('tr')
      for (let j = 0; j < colCount; j++) {
        let cellId = cells[i][j]
        // Merged cells (cellId is null) are skipped
        if (cellId) {
          let cellNode = doc.get(cellId)
          let cellEl = $$(TableCellComponent, {
            node: cellNode,
            disabled: this.props.disabled
          }).ref(cellNode.id)
          rowEl.append(cellEl)
        }
      }
      el.append(rowEl)
    }
    return el
  }

}

TableComponent.hasDropzones = true

export default TableComponent
