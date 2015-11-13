'use strict';

var $ = require('../../util/jquery');
var Node = require('../../model/DocumentNode');

var ListItem = Node.extend({
  displayName: "ListItem",
  name: "list-item",
  properties: {
    parent: "id",
    level: "number",
    ordered: "bool",
    content: "string"
  },
});

ListItem.static.components = ['content'];

ListItem.static.defaultProperties = {
  level: 1,
  orderered: false,
  content: ""
};

module.exports = ListItem;
