'use strict';

var oo = require('../../util/oo');
var DocumentNode = require('../../model/DocumentNode');

function ListItem() {
  ListItem.super.apply(this, arguments);
}

oo.inherit(ListItem, DocumentNode);

ListItem.static.name = "list-item";

ListItem.static.defineSchema({
  parent: "id",
  level: { type: "number", default: 1 },
  ordered: { type: "bool", default: false },
  content: "text"
});

module.exports = ListItem;
