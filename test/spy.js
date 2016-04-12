'use strict';

module.exports = function spy(self, name) {
  var f = self[name];
  function spyFunction() {
    var res = f.apply(self, arguments);
    spyFunction.callCount++;
    return res;
  }
  spyFunction.callCount = 0;
  spyFunction.restore = function() {
    self[name] = f;
  };
  spyFunction.reset = function() {
    spyFunction.callCount = 0;
  }
  self[name] = spyFunction;
  return spyFunction;
};
