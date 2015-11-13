'use strict';

var $ = require('../../util/jquery');
var TextNode = require('../../model/TextNode');

var Heading = TextNode.extend({
  name: "heading",
  displayName: "Heading",
  properties: {
    "level": "number"
  }
});

// HtmlImporter

Heading.static.blockType = true;

Heading.static.tocType = true;

module.exports = Heading;