/**
  A scope to store global variables.

  Note: We are using global variables only for debugging.
*/
var substanceGlobals = {
};

if (global.hasOwnProperty('Substance')) {
  throw new Error('global.Substance is already defined.');
}
global.Substance = substanceGlobals;

module.exports = substanceGlobals;
