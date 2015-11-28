'use strict';

var oo = require('../util/oo');

/*
  Anchors are special annotations which have a zero width.

  Examples are the start and end anchors of ContainerAnnotations, or a Cursor.

  TODO: in future we will need to introduce a built-in type
  for this so that annotation updates can be compared with
  text operations.

  Sub-Classes: model/ContainerAnnotation.Anchor, model/Selection.Cursor

  @class
  @abstract
*/
function Anchor(path, offset) {
  this.path = path;
  this.offset = offset;
}

Anchor.Prototype = function() {

  this.isAnchor = function() {
    return true;
  };

  this.getPath = function() {
    return this.path;
  };

  this.getOffset = function() {
    return this.offset;
  };

};

oo.initClass(Anchor);

module.exports = Anchor;


