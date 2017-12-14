/**
  A place to store global variables.
*/
const _global = (typeof global !== 'undefined') ? global : window
const substanceGlobals = _global.hasOwnProperty('Substance') ? _global.Substance : _global.Substance = {
  DEBUG_RENDERING: false
}
export default substanceGlobals
