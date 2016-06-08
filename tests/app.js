'use strict';

var substanceGlobals = require('../util/substanceGlobals');
substanceGlobals.TEST_UI = true;
var harness = require('./test');

var TestSuite = require('./TestSuite');

require('./model/ContainerSelection.test');

window.onload = function() {
  TestSuite.static.mount({ harness: harness }, 'body')
};
