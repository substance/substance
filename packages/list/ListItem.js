'use strict';

var TextBlock = require('../../model/TextBlock');

function ListItem() {
  ListItem.super.apply(this, arguments);
}

TextBlock.extend(ListItem);

ListItem.type = 'list-item';

ListItem.define({
  listType: { type: 'string', default: 'unordered' },
  level: { type: 'number', default: 1 }
});

module.exports = ListItem;
