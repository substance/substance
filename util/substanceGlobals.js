/**
  A place to store global variables.
*/
var substanceGlobals = {};

var _global = (typeof global !== 'undefined') ? global : window

if (_global.hasOwnProperty('Substance')) {
  console.warn('global.Substance is already defined.');
  substanceGlobals = _global.Substance;
} else {
  _global.Substance = substanceGlobals;
}

export default substanceGlobals;
