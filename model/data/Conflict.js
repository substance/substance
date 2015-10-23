'use strict';

function Conflict(a, b) {
  Error.call(this, "Conflict: " + JSON.stringify(a) +" vs " + JSON.stringify(b));
  this.a = a;
  this.b = b;
}
Conflict.prototype = Error.prototype;

module.exports = Conflict;
