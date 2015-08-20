'use strict';

var Document = require('../../document');

var MetaNode = Document.Node.extend({
  name: "meta",
  properties: {
    "title": "string"
  }
});

MetaNode.static.matchElement = function($el) {
  return $el.attr('typeof') === 'meta';
};

MetaNode.static.fromHtml = function($el, converter) {
  var id = 'meta';
  var meta = {
    id: id,
    title: ""
  };
  var $title = $el.find('[property=title]');
  if ($title.length) {
    meta.title = converter.annotatedText($title, [id, 'title']);
  } else {
    converter.warning('MetaNode: no title found.');
  }
  return meta;
};

MetaNode.static.toHtml = function(articleMeta, converter) {
  var id = articleMeta.id;
  var $el = $('<div>')
    .attr('typeof', 'meta')
    .attr('id', id);

  var $title = $('<h1>')
    .attr('property', 'title')
    .append(converter.annotatedText([id, 'title']));

  return $el.append($title);
};

module.exports = MetaNode;
