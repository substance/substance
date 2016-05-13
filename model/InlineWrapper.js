'use strict';

var InlineNode = require('./InlineNode');

function InlineWrapper() {
  InlineWrapper.super.apply(this, arguments);
}

InlineNode.extend(InlineWrapper);

InlineWrapper.static.name = 'inline-wrapper';

InlineWrapper.static.defineSchema({
  wrappedNode: 'id'
});

module.exports = InlineWrapper;
