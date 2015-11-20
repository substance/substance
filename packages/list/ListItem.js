'use strict';

var DocumentNode = require('../../model/DocumentNode');

function ListItem() {
  ListItem.super.apply(this, arguments);
}

DocumentNode.extend(ListItem);

ListItem.static.name = "list-item";

ListItem.static.defineSchema({
  parent: "id",
  level: { type: "number", default: 1 },
  ordered: { type: "bool", default: false },
  content: "text"
});

module.exports = ListItem;
