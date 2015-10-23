'use strict';

var Node = require('./DocumentNode');

// Text Node
// ---------
//
// A base class for all text-ish nodes, such as Paragraphs, Headings,
// Prerendered, etc.

var TextNode = Node.extend({
  displayName: "TextNode",
  name: "text",

  properties: {
    content: 'string'
  },

  getTextPath: function() {
    return [this.id, 'content'];
  },

  getText: function() {
    return this.content;
  },
});

TextNode.static.components = ['content'];

module.exports = TextNode;
