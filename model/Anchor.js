'use strict';

import Coordinate from './Coordinate'

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
function Anchor() {
  Anchor.super.apply(this, arguments);
}

Anchor.Prototype = function() {

  this.isAnchor = function() {
    return true;
  };

};

Coordinate.extend(Anchor);

export default Anchor;
