import Table from './Table'
import TableCell from './TableCell'
import TableComponent from './TableComponent'
import TableHTMLConverter from './TableHTMLConverter'
import TableCellHTMLConverter from './TableCellHTMLConverter'

export default {
  name: 'table',
  configure: function(config) {
    config.addNode(Table)
    config.addNode(TableCell)
    config.addComponent('table', TableComponent)
    config.addConverter('html', TableHTMLConverter)
    config.addConverter('html', TableCellHTMLConverter)
    config.addConverter('xml', TableHTMLConverter)
    config.addConverter('xml', TableCellHTMLConverter)
    config.addLabel('table', {
      en: 'Table',
      de: 'Tabelle'
    })
    config.addLabel('table-cell.content', {
      en: 'Cell',
      de: 'Zelle'
    })
  }
}
