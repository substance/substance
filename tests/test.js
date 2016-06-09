'use strict';

var substanceGlobals = require('../util/substanceGlobals');
var inBrowser = require('../util/inBrowser');
var tape = require('tape');

var harness = null;

if (!harness) {
  if (inBrowser && substanceGlobals.TEST_UI) {
    harness = require('./harness');
  } else {
    harness = tape;
  }
}

module.exports = harness;
