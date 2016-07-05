'use strict';

var InlineNode = require('../../model/InlineNode');

function InlineWrapper() {
  InlineWrapper.super.apply(this, arguments);
}

InlineWrapper.Prototype = function() {
  this.getWrappedNode = function() {
    return this.getDocument().get(this.wrappedNode);
  };
};

InlineNode.extend(InlineWrapper);

InlineWrapper.static.name = 'inline-wrapper';

InlineWrapper.static.defineSchema({
  wrappedNode: 'id'
});

module.exports = InlineWrapper;
