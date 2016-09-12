'use strict';

import oo from './oo'

/*
  An iterator for arrays.
  @class
  @param {Array} arr
 */
function ArrayIterator(arr) {
  this.arr = arr;
  this.pos = -1;
}

ArrayIterator.Prototype = function() {

  this._isArrayIterator = true;

  /**
    @returns {Boolean} true if there is another child node left.
   */
  this.hasNext = function() {
    return this.pos < this.arr.length - 1;
  };

  /**
    Increments the iterator providing the next child node.

    @returns {HTMLElement} The next child node.
   */
  this.next = function() {
    this.pos += 1;
    var next = this.arr[this.pos];
    return next;
  };

  /**
    Decrements the iterator.
   */
  this.back = function() {
    if (this.pos >= 0) {
      this.pos -= 1;
    }
    return this;
  };

};

oo.initClass(ArrayIterator);

export default ArrayIterator;
