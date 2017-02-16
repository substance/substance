import ListNode from './ListNode'
import ListItemNode from './ListItemNode'
import ListComponent from './ListComponent'
import ListHTMLConverter from './ListHTMLConverter'
import ListItemHTMLConverter from './ListItemHTMLConverter'
import InsertListCommand from './InsertListCommand'
import InsertListTool from './InsertListTool'

export default {
  name: 'list',
  configure: function(config, {toolGroup, disableCollapsedCursor}) {
    config.addNode(ListNode)
    config.addNode(ListItemNode)
    config.addComponent('list', ListComponent)

    config.addCommand('insert-unordered-list', InsertListCommand, {
      nodeType: 'list',
      ordered: false,
      disableCollapsedCursor
    })
    config.addTool('insert-unordered-list', InsertListTool, { toolGroup })
    config.addLabel('insert-unordered-list', {
      en: 'Unordered list',
      de: 'Aufzählung'
    })
    config.addIcon('insert-unordered-list', { 'fontawesome': 'fa-list-ul' })

    config.addCommand('insert-ordered-list', InsertListCommand, {
      nodeType: 'list',
      ordered: true,
      disableCollapsedCursor
    })
    config.addTool('insert-ordered-list', InsertListTool, { toolGroup })
    config.addLabel('insert-ordered-list', {
      en: 'Ordered list',
      de: 'Nummerierte Liste'
    })
    config.addIcon('insert-ordered-list', { 'fontawesome': 'fa-list-ol' })

    config.addConverter('html', ListHTMLConverter)
    config.addConverter('html', ListItemHTMLConverter)
  }
}
