'use strict';

var _ = require('../util/helpers');
var Node = require('./DocumentNode');

/**
   An annotation can be used to overlay text and give it a special meaning.
   Annotations only work on text properties. If you want to annotate multiple
   nodes you have to use a ContainerAnnotation.

  @prop {String} path Identifies a text property in the document (e.g. ["text_1", "content"])
  @prop {Number} startOffset the character where the annoation starts
  @prop {Number} endOffset: the character where the annoation starts
**/

var PropertyAnnotation = Node.extend({
  name: "annotation",

  properties: {
    path: ['array', 'string'],
    startOffset: 'number',
    endOffset: 'number'
  },

  static: {
    isInline: true
  },

  canSplit: function() {
    return true;
  },

  getSelection: function() {
    return this.getDocument().createSelection({
      type: 'property',
      path: this.path,
      startOffset: this.startOffset,
      endOffset: this.endOffset
    });
  },

  updateRange: function(tx, sel) {
    if (!sel.isPropertySelection()) {
      throw new Error('Cannot change to ContainerAnnotation.');
    }
    if (!_.isEqual(this.startPath, sel.start.path)) {
      tx.set([this.id, 'path'], sel.start.path);
    }
    if (this.startOffset !== sel.start.offset) {
      tx.set([this.id, 'startOffset'], sel.start.offset);
    }
    if (this.endOffset !== sel.end.offset) {
      tx.set([this.id, 'endOffset'], sel.end.offset);
    }
  },

  getText: function() {
    var doc = this.getDocument();
    if (!doc) {
      console.warn('Trying to use an PropertyAnnotation which is not attached to the document.');
      return "";
    }
    var text = doc.get(this.path);
    return text.substring(this.startOffset, this.endOffset);
  },

});

Object.defineProperties(PropertyAnnotation.prototype, {
  startPath: {
    get: function() {
      return this.path;
    }
  },
  endPath: {
    get: function() {
      return this.path;
    }
  }
});

module.exports = PropertyAnnotation;
