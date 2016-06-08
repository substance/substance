'use strict';

var substanceGlobals = require('../util/substanceGlobals');
var inBrowser = require('../util/inBrowser');

var tape = require('tape');
var harness = null;

if (!harness) {
  if (inBrowser && substanceGlobals.TEST_UI) {
    harness = tape.createHarness();
    var results = harness._results;

    // results.on('_push', function(t) {
    //   console.log('### Pushed test', t)
    // });

    // results.on('done', function() {
    //   console.log('### Done');
    // });

    var nextTick = process.nextTick;

    harness.runAllTests = function() {
      var i = 0;
      function next() {
        while (i < results.tests.length) {
          var t = results.tests[i++];
          t.run();
          if (!t.ended) return t.once('end', function(){ nextTick(next); });
        }
      }
      nextTick(next);
    };

  } else {
    harness = tape;
  }
}


module.exports = harness;
