if (typeof window !== 'undefined') {
  if (!window.MutationObserver) {
    window.MutationObserver = function() {
      this.observe = function() {};
      this.disconnect = function() {};
    };
  }
  if (!Function.prototype.bind) {
    Function.prototype.bind = Function.prototype.bind || function (thisp) {
      var fn = this;
      return function () {
        return fn.apply(thisp, arguments);
      };
    };
  }
}
