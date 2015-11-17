'use strict';

var DocumentNode = require('../../model/DocumentNode');

var ListItem = DocumentNode.extend();

ListItem.static.name = "list-item";

ListItem.static.schema = {
  parent: { type: "id" },
  level: { type: "number", 'default': 1 },
  ordered: { type: "bool", 'default': false },
  content: { type: "text", 'default': '' }
};

module.exports = ListItem;
