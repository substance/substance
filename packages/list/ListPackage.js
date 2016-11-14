import List from './List'
import ListItem from './ListItem'
import ListComponent from './ListComponent'
import ListHTMLConverter from './ListHTMLConverter'
import ListItemHTMLConverter from './ListItemHTMLConverter'

export default {
  name: 'list',
  configure: function(config) {
    config.addNode(List);
    config.addNode(ListItem);
    config.addComponent('list', ListComponent)
    config.addConverter('html', ListHTMLConverter)
    config.addConverter('html', ListItemHTMLConverter)
  }
}
