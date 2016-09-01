'use strict';

import ListItem from './ListItem'
import ListItemComponent from './ListItemComponent'
import ListEditing from './ListEditing'
import ListMacro from './ListMacro'


export default {
  name: 'list-item',
  configure: function(config, options) {
    config.addNode(ListItem);
    config.addComponent(ListItem.type, ListItemComponent);
    config.addTextType({
      name: 'list-item',
      data: { type: 'list-item' }
    });
    config.addEditingBehavior(ListEditing);
    if (options.enableMacro) {
      config.addMacro(ListMacro);
    }
    config.addLabel('list', {
      en: 'List',
      de: 'Liste'
    });
    config.addLabel('list-item', {
      en: 'List',
      de: 'Liste'
    });
  },
  ListItem: ListItem,
  ListItemComponent: ListItemComponent,
  ListEditing: ListEditing,
  ListMacro: ListMacro,
};
