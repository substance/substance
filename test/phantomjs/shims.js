if (typeof window !== 'undefined') {
  require('./MutationObserver.shim')
  require('./bind.polyfill');
  // require('./DOMParser.polyfill');
}
