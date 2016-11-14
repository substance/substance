/**
  A place to store global variables.
*/
var substanceGlobals = {};

var _global = (typeof global !== 'undefined') ? global : window

if (_global.hasOwnProperty('Substance')) {
  substanceGlobals = _global.Substance
} else {
  _global.Substance = substanceGlobals
}

substanceGlobals.DEBUG_RENDERING = true

export default substanceGlobals
