import ListNode from './ListNode'
import ListItemNode from './ListItemNode'
import ListComponent from './ListComponent'
import ListHTMLConverter from './ListHTMLConverter'
import ListItemHTMLConverter from './ListItemHTMLConverter'

export default {
  name: 'list',
  configure: function(config) {
    config.addNode(ListNode);
    config.addNode(ListItemNode);
    config.addComponent('list', ListComponent)
    config.addConverter('html', ListHTMLConverter)
    config.addConverter('html', ListItemHTMLConverter)
  }
}
