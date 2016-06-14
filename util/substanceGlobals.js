'use strict';

var warn = require('./warn');
/**
  A place to store global variables.
*/
var substanceGlobals = {};

if (global.hasOwnProperty('Substance')) {
  warn('global.Substance is already defined.');
  substanceGlobals = global.Substance;
} else {
  global.Substance = substanceGlobals;
}

module.exports = substanceGlobals;
