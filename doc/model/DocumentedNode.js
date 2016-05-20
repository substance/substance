'use strict';

var DocumentNode = require('../../model/DocumentNode');

function DocumentedNode() {
  DocumentedNode.super.apply(this, arguments);
}

DocumentedNode.Prototype = function() {

  // Defaults to the regular type property
  this.getSpecificType = function() {
    return this.type;
  };
};

DocumentNode.extend(DocumentedNode);

DocumentedNode.static.name = 'source-code';

DocumentedNode.static.defineSchema({
  description: { type: 'string', optional: true }, // HTML
  example: { type: 'string', optional: true }, // HTML
  sourceFile: 'string', // ui/Component.js
  sourceLine: 'number',
  isPrivate: { type: 'boolean', default: false },
  tags: { type: ['array', 'object'], default: [] }, // [ { name: 'type', string: '...', html: '...'}]
});

DocumentedNode.static.isBlock = true;

module.exports = DocumentedNode;
