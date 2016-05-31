'use strict';

var ListItem = require('./ListItem');
var ListItemComponent = require('./ListItemComponent');
var ListEditing = require('./ListEditing');

module.exports = {
  name: 'list-item',
  configure: function(config) {
    config.addNode(ListItem);
    config.addComponent(ListItem.static.name, ListItemComponent);
    config.addTextType({
      name: 'list-item',
      data: { type: 'list-item' }
    });
    config.addEditingBehavior(ListEditing);
  }
}
