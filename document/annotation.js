'use strict';

var Substance = require('../basics');
var Node = require('./node');

// Annotation
// --------
//
// An annotation can be used to overlay text and give it a special meaning.
// Annotations only work on text properties. If you want to annotate multiple
// nodes you have to use a ContainerAnnotation.
//
// Properties:
//   - path: Identifies a text property in the document (e.g. ["text_1", "content"])
//   - startOffset: the character where the annoation starts
//   - endOffset: the character where the annoation starts

// TODO: in current terminology this is a PropertyAnnotation
var Annotation = Node.extend({
  displayName: "Annotation",
  name: "annotation",

  properties: {
    path: ['array', 'string'],
    startOffset: 'number',
    endOffset: 'number'
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
    if (!Substance.isEqual(this.startPath, sel.start.path)) {
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
      console.warn('Trying to use an Annotation which is not attached to the document.');
      return "";
    }
    var text = doc.get(this.path);
    return text.substring(this.startOffset, this.endOffset);
  },

  // volatile property necessary to render highlighted annotations differently
  setActive: function(val) {
    if (this.active !== val) {
      this.active = val;
      this.emit('active', val);
    }
  },

});

Annotation.static.isInline = true;

// default implementation for inline elements
// Attention: there is a difference between the implementation
// of toHtml for annotations and general nodes.
// Annotations are modeled as overlays, so they do not 'own' their content.
// Thus, during conversion HtmlExporter serves the content as a prepared
// array of children element which just need to be wrapped (or can be manipulated).
Annotation.static.toHtml = function(anno, converter, children) {
  var id = anno.id;
  var tagName = anno.constructor.static.tagName || 'span';
  var $el = $('<' + tagName + '>')
    .attr('id', id)
    .append(children);
  return $el;
};

Object.defineProperties(Annotation.prototype, {
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

module.exports = Annotation;
