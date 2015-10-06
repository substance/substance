'use strict';

var $ = require('../../basics/jquery');
var TextNode = require('../text_node');

var Codeblock = TextNode.extend({
  displayName: "Codeblock",
  name: "codeblock"
});

// HtmlImporter

Codeblock.static.blockType = true;

Codeblock.static.matchElement = function($el) {
  return $el.is('pre');
};

Codeblock.static.fromHtml = function($el, converter) {
  var $codeEl = $el.find('code');
  var id = converter.defaultId($el, 'codeblock');
  var codeblock = {
    id: id,
    content: ''
  };
  codeblock.content = converter.annotatedText($codeEl, [id, 'content']);
  return codeblock;
};

// HtmlExporter

Codeblock.static.toHtml = function(codeblock, converter) {
  var id = codeblock.id;
  var $el = $('<pre>')
    .attr('id', id);
  var $codeEl = $('<code>');
  $codeEl.append(converter.annotatedText([id, 'content']));
  $el.append($codeEl);
  return $el;
};

module.exports = Codeblock;
