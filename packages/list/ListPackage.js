import List from './List'
import ListItem from './ListItem'
import ListComponent from './ListComponent'
import ListEditing from './ListEditing'

export default {
  name: 'list',
  configure: function(config) {
    config.addNode(List);
    config.addNode(ListItem);
    config.addComponent('list', ListComponent)
    config.addEditingBehavior(ListEditing)
  }
}
