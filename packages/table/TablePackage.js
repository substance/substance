import Table from './Table'
import TableCell from './TableCell'
import TableComponent from './TableComponent'

export default {
  name: 'table',
  configure: function(config) {
    config.addNode(Table)
    config.addNode(TableCell)
    config.addComponent('table', TableComponent)
  }
}
