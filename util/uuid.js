'use strict';

/*!
Math.uuid.js (v1.4)
http://www.broofa.com
mailto:robert@broofa.com
Copyright (c) 2010 Robert Kieffer
Dual licensed under the MIT and GPL licenses.
*/

/**
 * Generates a unique id.
 *
 * @param {String} [prefix] if provided the UUID will be prefixed.
 * @param {Number} [len] if provided a UUID with given length will be created.
 * @return A generated uuid.
 */
function uuid(prefix, len) {
  if (prefix && prefix[prefix.length-1] !== "-") {
    prefix = prefix.concat("-");
  }
  var chars = '0123456789abcdefghijklmnopqrstuvwxyz'.split('');
  var uuid = [];
  var radix = 16;
  var idx;
  len = len || 32;
  if (len) {
    // Compact form
    for (idx = 0; idx < len; idx++) uuid[idx] = chars[0 | Math.random()*radix];
  } else {
    // rfc4122, version 4 form
    var r;
    // rfc4122 requires these characters
    uuid[8] = uuid[13] = uuid[18] = uuid[23] = '-';
    uuid[14] = '4';
    // Fill in random data.  At i==19 set the high bits of clock sequence as
    // per rfc4122, sec. 4.1.5
    for (idx = 0; idx < 36; idx++) {
      if (!uuid[idx]) {
        r = 0 | Math.random()*16;
        uuid[idx] = chars[(idx === 19) ? (r & 0x3) | 0x8 : r];
      }
    }
  }
  return (prefix ? prefix : "") + uuid.join('');
}

export default uuid;