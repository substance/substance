import ListNode from './ListNode'
import ListItemNode from './ListItemNode'
import ListComponent from './ListComponent'
import ListHTMLConverter from './ListHTMLConverter'
import ListItemHTMLConverter from './ListItemHTMLConverter'
import InsertOrderedListCommand from './InsertOrderedListCommand'
import InsertUnorderedListCommand from './InsertUnorderedListCommand'
import InsertListTool from './InsertListTool'

export default {
  name: 'list',
  configure: function(config) {
    config.addNode(ListNode);
    config.addNode(ListItemNode);
    config.addComponent('list', ListComponent)

    config.addCommand('insert-unordered-list', InsertUnorderedListCommand, { nodeType: 'list' })
    config.addTool('insert-unordered-list', InsertListTool, { toolGroup: options.toolGroup })
    config.addLabel('insert-unordered-list', {
      en: 'Unordered list'
    })
    config.addIcon('insert-unordered-list', { 'fontawesome': 'fa-list-ul' })

    config.addCommand('insert-ordered-list', InsertOrderedListCommand, { nodeType: 'list' })
    config.addTool('insert-ordered-list', InsertListTool, { toolGroup: options.toolGroup })
    config.addLabel('insert-ordered-list', {
      en: 'Ordered list'
    })
    config.addIcon('insert-ordered-list', { 'fontawesome': 'fa-list-ol' })

    config.addConverter('html', ListHTMLConverter)
    config.addConverter('html', ListItemHTMLConverter)

  }
}
