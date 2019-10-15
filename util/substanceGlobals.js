import _isDefined from './_isDefined'

/**
  A place to store global variables.
*/
const _global = (typeof global !== 'undefined') ? global : window
const substanceGlobals = _isDefined(_global.Substance) ? _global.Substance : _global.Substance = {}
export default substanceGlobals
