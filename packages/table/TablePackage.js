import TableNode from './TableNode'
import TableComponent from './TableComponent'
import InsertTableCommand from './InsertTableCommand'
import Tool from '../tools/Tool'

export default {
  name: 'table',
  configure: function(config) {
    config.addNode(TableNode)
    config.addComponent('table', TableComponent)
    config.addCommand('insert-table', InsertTableCommand)
    config.addTool('insert-table', Tool)
    config.addIcon('insert-table', { 'fontawesome': 'fa-table' })
    config.addLabel('table', {
      en: 'Table',
      de: 'Tabelle'
    })
  },
  Table: TableNode,
  TableComponent: TableComponent,
  InsertTableCommand: InsertTableCommand
}
