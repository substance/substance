'use strict';

var $ = require('../../basics/jquery');
var TextNode = require('../../document/text_node');

var Paragraph = TextNode.extend({
  displayName: "Paragraph",
  name: "paragraph"
});

// HtmlImporter

Paragraph.static.blockType = true;

Paragraph.static.matchElement = function($el) {
  return $el.is('p');
};

Paragraph.static.fromHtml = function($el, converter) {
  var id = converter.defaultId($el, 'p');
  var paragraph = {
    id: id,
    content: ''
  };
  paragraph.content = converter.annotatedText($el, [id, 'content']);
  return paragraph;
};

// HtmlExporter

Paragraph.static.toHtml = function(paragraph, converter) {
  var id = paragraph.id;
  var $el = $('<p>')
    .attr('id', id);
  $el.append(converter.annotatedText([id, 'content']));
  return $el;
};

module.exports = Paragraph;
