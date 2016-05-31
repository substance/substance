'use strict';

var TextBlock = require('../../model/TextBlock');

function ListItem() {
  ListItem.super.apply(this, arguments)
};

TextBlock.extend(ListItem);

ListItem.static.name = 'list-item';

ListItem.static.defineSchema({
  listType: { type: 'string', default: 'unordered' },
  level: { type: 'number', default: 1 }
});

module.exports = ListItem;
