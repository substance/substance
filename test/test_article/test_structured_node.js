'use strict';

var DocumentNode = require('../../model/node');

var StructuredNode = DocumentNode.extend({
  name: "structured-node",
  properties: {
    title: "string",
    body: "string",
    caption: "string"
  },
});

StructuredNode.static.defaultProperties = {
  title: "",
  body: "",
  caption: ""
};

StructuredNode.static.components = ['title', 'body', 'caption'];

StructuredNode.static.blockType = true;

StructuredNode.static.matchElement = function($el) {
  return $el.is('div[typeof=structured-node]');
};

StructuredNode.static.fromHtml = function($el, converter) {
  var id = converter.defaultId($el, 'structured-node');
  var node = { id: id };
  node.title = converter.annotatedText($el.find('span[property=title]'), [id, 'title']);
  node.body = converter.annotatedText($el.find('span[property=body]'), [id, 'body']);
  node.caption = converter.annotatedText($el.find('span[property=caption]'), [id, 'caption']);
  return node;
};

StructuredNode.static.toHtml = function(node, converter) {
  var id = node.id;
  var $el = ('<div>')
    .attr('id', id);

  ['title', 'body', 'caption'].forEach(function(name) {
    var $child = $('<span property="' + name + '">')
      .append(converter.annotatedText([id, name]));
    $el.append($child);
  });

  return $el;
};

module.exports = StructuredNode;
