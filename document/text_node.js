'use strict';

var Node = require('./node');

// Text Node
// ---------
//
// A base class for all text-ish nodes, such as Paragraphs, Headings,
// Prerendered, etc.

var TextNode = Node.extend({
  name: "text",
  properties: {
    content: 'string'
  },
});

TextNode.static.components = ['content'];

module.exports = TextNode;
