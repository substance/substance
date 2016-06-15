'use strict';

var ListItem = require('./ListItem');
var ListItemComponent = require('./ListItemComponent');
var ListEditing = require('./ListEditing');
var ListMacro = require('./ListMacro');

module.exports = {
  name: 'list-item',
  configure: function(config, options) {
    config.addNode(ListItem);
    config.addComponent(ListItem.static.name, ListItemComponent);
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
  }
};
