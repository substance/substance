var Node = require('../node');

var ListItem = Node.extend({
  name: "list-item",
  properties: {
    parent: "id",
    level: "number",
    content: "string",
  },
});

ListItem.static.components = ['content'];

// HtmlImporter

ListItem.static.matchElement = function($el) {
  return $el.is('li');
};

ListItem.static.fromHtml = function($el, converter) {
  var level = $el.data('level') || 1;
  var id = converter.defaultId($el, 'li');
  var item = {
    id: id,
    level: level,
    content: ''
  };
  item.content = converter.annotatedText($el, [id, 'content']);
  return item;
};

ListItem.static.toHtml = function(item, converter) {
  var id = item.id;
  var $el = $('<li>')
    .attr('id', item.id)
    .data('level', item.level)
    .append(converter.annotatedText([id, 'content']))
  return $el;
};

module.exports = ListItem;
