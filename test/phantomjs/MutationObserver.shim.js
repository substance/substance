if (!window.MutationObserver) {
  window.MutationObserver = function() {
    this.observe = function() {};
    this.disconnect = function() {};
  };
}
