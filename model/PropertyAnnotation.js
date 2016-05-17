'use strict';

var isEqual = require('lodash/isEqual');
var warn = require('../util/warn');
var DocumentNode = require('./DocumentNode');

/**
  A property annotation can be used to overlay text and give it a special meaning.
  PropertyAnnotations only work on text properties. If you want to annotate multiple
  nodes you have to use a {@link model/ContainerAnnotation}.

  @class
  @abstract

  @prop {String[]} path Identifies a text property in the document (e.g. `['text_1', 'content']`)
  @prop {Number} startOffset the character where the annoation starts
  @prop {Number} endOffset: the character where the annoation starts

  @example

  Here's how a **strong** annotation is created. In Substance annotations are stored
  separately from the text. Annotations are just regular nodes in the document.
  They refer to a certain range (`startOffset, endOffset`) in a text property (`path`).

  ```js
  doc.transaction(function(tx) {
    tx.create({
      id: 's1',
      type: 'strong',
      path: ['p1', 'content'],
      "startOffset": 10,
      "endOffset": 19
    });
  });
  ```
**/

function PropertyAnnotation() {
  PropertyAnnotation.super.apply(this, arguments);
}

PropertyAnnotation.Prototype = function() {

  this._isPropertyAnnotation = true;

  /**
    Get the plain text spanned by this annotation.

    @returns {String}
  */
  this.getText = function() {
    var doc = this.getDocument();
    if (!doc) {
      warn('Trying to use an PropertyAnnotation which is not attached to the document.');
      return "";
    }
    var text = doc.get(this.path);
    return text.substring(this.startOffset, this.endOffset);
  };

  /**
    Determines if an annotation can be split e.g., when breaking a node.

    In these cases, a new annotation will be created attached to the created node.

    For certain annotation types,you may want to the annotation truncated
    rather than split, where you need to override this method returning `false`.
  */
  this.canSplit = function() {
    return true;
  };

  /**
    If this annotation is a an Anchor.

    Anchors are annotations with a zero width.
    For instance, ContainerAnnotation have a start and an end anchor,
    or rendered cursors are modeled as anchors.

    @returns {Boolean}
  */
  this.isAnchor = function() {
    return false;
  };

  // TODO: maybe this should go into documentHelpers
  this.getSelection = function() {
    return this.getDocument().createSelection({
      type: 'property',
      path: this.path,
      startOffset: this.startOffset,
      endOffset: this.endOffset
    });
  };

  this.updateRange = function(tx, sel) {
    if (!sel.isPropertySelection()) {
      throw new Error('Cannot change to ContainerAnnotation.');
    }
    if (!isEqual(this.startPath, sel.start.path)) {
      tx.set([this.id, 'path'], sel.start.path);
    }
    if (this.startOffset !== sel.start.offset) {
      tx.set([this.id, 'startOffset'], sel.start.offset);
    }
    if (this.endOffset !== sel.end.offset) {
      tx.set([this.id, 'endOffset'], sel.end.offset);
    }
  };

};

DocumentNode.extend(PropertyAnnotation);

PropertyAnnotation.static.name = "annotation";

PropertyAnnotation.static.defineSchema({
  path: ["string"],
  startOffset: "number",
  endOffset: "number"
});

PropertyAnnotation.static.isPropertyAnnotation = true;

// these properties making PropertyAnnotation compatible with ContainerAnnotations
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
