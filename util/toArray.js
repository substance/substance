'use strict';

/*
  Turns array-like things (e.g. Node List, ClientRect List) into an array.
*/

function toArray(list) {
  var array = [];
  // iterate backwards ensuring that length is an UInt32
  for (var i = list.length >>> 0; i--;) { 
    array[i] = list[i];
  }
  return array;
}

module.exports = toArray;