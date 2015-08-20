'use strict';

var DocumentNode = require('../../document/node');

var TestNode = DocumentNode.extend({
  name: "test-node",
  properties: {
    boolVal: "boolean",
    stringVal: "string",
    arrayVal: ["array","string"],
    objectVal: "object",
  },
});

TestNode.static.defaultProperties = {
  boolVal: false,
  stringVal: "",
  arrayVal: [],
  objectVal: {}
};

TestNode.static.components = [];

// HtmlImporter

TestNode.static.blockType = true;

TestNode.static.matchElement = function($el) {
  return $el.is('div[typeof=test]');
};

TestNode.static.fromHtml = function($el, converter) {
  var id = converter.defaultId($el, 'test-node');
  var node = {
    id: id
  };
  node.boolVal = !!$el.data('boolVal');
  node.stringVal = $el.data('stringVal') || "";
  node.arrayVal = ($el.data('arrayVal') || "").split(/\s*,\s*/);
  var $script = $el.find('script');
  if ($script.length) {
    node.objectVal = JSON.parse($script.text());
  }
  return node;
};

TestNode.static.toHtml = function(node) {
  var id = node.id;
  var $el = ('<div>')
    .attr('id', id)
    .data('boolVal', node.boolVal)
    .data('stringVal', node.stringVal)
    .data('arrayVal', node.arrayVal.join(','))
    .append($('<script>').text(JSON.stringify(node.objectVal)));
  return $el;
};

module.exports = TestNode;
