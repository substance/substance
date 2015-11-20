'use strict';

var oo = require('../../util/oo');
var Node = require('../../model/DocumentNode');

function DocumentedNode() {
  DocumentedNode.super.apply(this, arguments);
}

DocumentedNode.Prototype = function() {

  // Defaults to the regular type property
  this.getSpecificType = function() {
    return this.type;
  };

  this.getTocName = function() {
    return this.name;
  };

};

oo.inherit(DocumentedNode, Node);

DocumentedNode.static.name = 'source-code';

DocumentedNode.static.defineSchema({
  description: { type: 'string', optional: true }, // HTML
  example: { type: 'string', optional: true }, // HTML
  sourceFile: 'string', // ui/Component.js
  sourceLine: 'number',
  tags: { type: ['array', 'object'], default: [] }, // [ { name: 'type', string: '...', html: '...'}]
});

DocumentedNode.static.isBlock = true;

module.exports = DocumentedNode;
