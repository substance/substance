'use strict';

var oo = require('../util/oo');
var DocumentNode = require('./DocumentNode');

/**
  A base class for all text-ish nodes, such as Paragraphs, Headings,
  Prerendered, etc.

  @class
  @abstract
*/

function TextNode() {
  TextNode.super.apply(this, arguments);
}

TextNode.Prototype = function() {

  this.getTextPath = function() {
    return [this.id, 'content'];
  };

  this.getText = function() {
    return this.content;
  };
};

oo.inherit(TextNode, DocumentNode);

TextNode.static.name = "text-node";

TextNode.static.defineSchema({
  content: 'text'
});

module.exports = TextNode;
