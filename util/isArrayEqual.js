'use strict';

// TODO: do we really need this, or would lodash isEqual also work

/*
 * Check if two arrays are equal.
 *
 * @method isArrayEqual
 * @param {Array} a
 * @param {Array} b
 * @deprecated use `Helpers.isEqual` instead.
 */
module.exports = function isArrayEqual(a, b) {
  if (a === b) return true;
  if (a === null || b === null) return false;
  if (a.length != b.length) return false;
  for (var i = 0; i < a.length; ++i) {
    if (a[i] !== b[i]) return false;
  }
  return true;
};
