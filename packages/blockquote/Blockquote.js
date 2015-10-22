'use strict';

var $ = require('../../basics/jquery');
var TextNode = require('../../document/text_node');

var Blockquote = TextNode.extend({
  displayName: "Blockquote",
  name: "blockquote"
});

// HtmlImporter

Blockquote.static.blockType = true;

Blockquote.static.matchElement = function($el) {
  return $el.is('blockquote');
};

Blockquote.static.fromHtml = function($el, converter) {
  var id = converter.defaultId($el, 'blockquote');
  var blockquote = {
    id: id,
    content: ''
  };
  blockquote.content = converter.annotatedText($el, [id, 'content']);
  return blockquote;
};

// HtmlExporter

Blockquote.static.toHtml = function(paragraph, converter) {
  var id = paragraph.id;
  var $el = $('<blockquote>')
    .attr('id', id);
  $el.append(converter.annotatedText([id, 'content']));
  return $el;
};

module.exports = Blockquote;
