import ListNode from './ListNode'
import ListItemNode from './ListItemNode'
import ListComponent from './ListComponent'
import ListHTMLConverter from './ListHTMLConverter'
import ListItemHTMLConverter from './ListItemHTMLConverter'
import InsertListCommand from './InsertListCommand'
import ToggleListCommand from './ToggleListCommand'

export default {
  name: 'list',
  configure: function(config) {
    config.addNode(ListNode)
    config.addNode(ListItemNode)
    config.addComponent('list', ListComponent)
    config.addCommand('insert-unordered-list', InsertListCommand, {
      spec: { type: 'list', listType: 'bullet' },
      commandGroup: 'text-types'
    })
    config.addLabel('insert-unordered-list', {
      en: 'Unordered list',
      de: 'Aufzählung'
    })
    config.addIcon('insert-unordered-list', { 'fontawesome': 'fa-list-ul' })

    config.addCommand('insert-ordered-list', InsertListCommand, {
      spec: { type: 'list', listType: 'order' },
      commandGroup: 'text-types'
    })
    config.addLabel('insert-ordered-list', {
      en: 'Ordered list',
      de: 'Nummerierte Liste'
    })
    config.addIcon('insert-ordered-list', { 'fontawesome': 'fa-list-ol' })
    config.addConverter('html', ListHTMLConverter)
    config.addConverter('html', ListItemHTMLConverter)
  },
  ListNode,
  ListItemNode,
  ListComponent,
  ListHTMLConverter,
  ListItemHTMLConverter,
  InsertListCommand,
  ToggleListCommand
}
