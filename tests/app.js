'use strict';

var substanceGlobals = require('../util/substanceGlobals');
substanceGlobals.TEST_UI = true;
var harness = require('./test');

var TestSuite = require('./TestSuite');

window.onload = function() {
  TestSuite.static.mount({ harness: harness }, 'body')
};
