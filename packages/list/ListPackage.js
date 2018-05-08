import ListNode from './ListNode'
import ListItemNode from './ListItemNode'
import ListComponent from './ListComponent'
import ListHTMLConverter from './ListHTMLConverter'
import ListItemHTMLConverter from './ListItemHTMLConverter'
import ToggleListCommand from './ToggleListCommand'
import IndentListCommand from './IndentListCommand'

export default {
  name: 'list',
  configure: function(config) {
    config.addNode(ListNode)
    config.addNode(ListItemNode)
    config.addComponent('list', ListComponent)
    config.addConverter('html', ListHTMLConverter)
    config.addConverter('html', ListItemHTMLConverter)
    config.addCommand('toggle-unordered-list', ToggleListCommand, {
      spec: { listType: 'bullet' },
      commandGroup: 'list'
    })
    config.addLabel('toggle-unordered-list', {
      en: 'Toggle list',
      de: 'Liste entfernen'
    })
    config.addIcon('toggle-unordered-list', { 'fontawesome': 'fa-list-ul' })

    config.addCommand('toggle-ordered-list', ToggleListCommand, {
      spec: { listType: 'order' },
      commandGroup: 'list'
    })
    config.addLabel('toggle-ordered-list', {
      en: 'Toggle list',
      de: 'Aufzählung entfernen'
    })
    config.addIcon('toggle-ordered-list', { 'fontawesome': 'fa-list-ol' })

    config.addCommand('indent-list', IndentListCommand, {
      spec: { action: 'indent' },
      commandGroup: 'list'
    })
    config.addLabel('indent-list', {
      en: 'Increase indentation',
      de: 'Einrückung vergrößern'
    })
    config.addIcon('indent-list', { 'fontawesome': 'fa-indent' })

    config.addCommand('dedent-list', IndentListCommand, {
      spec: { action: 'dedent' },
      commandGroup: 'list'
    })
    config.addLabel('dedent-list', {
      en: 'Decrease indentation',
      de: 'Einrückung verringern'
    })
    config.addIcon('dedent-list', { 'fontawesome': 'fa-dedent' })

  },
  ListNode,
  ListItemNode,
  ListComponent,
  ListHTMLConverter,
  ListItemHTMLConverter,
  ToggleListCommand,
  IndentListCommand
}
