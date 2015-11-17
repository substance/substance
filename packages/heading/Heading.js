'use strict';

var TextNode = require('../../model/TextNode');

var Heading = TextNode.extend({
  name: "heading",
  displayName: "Heading",
  properties: {
    "level": "number"
  },

  getTocLevel: function() {
    return this.level;
  },

  getTocName: function() {
    return this.name;
  }
});

// HtmlImporter

Heading.static.blockType = true;
Heading.static.tocType = true;

module.exports = Heading;