if (!Function.prototype.bind) {
  Function.prototype.bind = Function.prototype.bind || function (self) {
    var fn = this;
    return function () {
      return fn.apply(self, arguments);
    };
  };
}
