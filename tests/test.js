'use strict';

var substanceGlobals = require('../util/substanceGlobals');
var inBrowser = require('../util/inBrowser');
var platform = require('../util/platform');
var DefaultDOMElement = require('../ui/DefaultDOMElement');
var isUndefined = require('lodash/isUndefined');

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

// harness.module = function(mname) {
//   var args = arguments;
//   var fn = new test(mname + ': ' + args.name, args.opts, args.cb);
//   fn.mname = mname;
//   return fn;
// }

// harness.module = function(name) {
//   return function(description, fn) {
//   tape(name+': '+description,  function (t) {
//     fn(t);
//   });
// }
// };

harness.UI = function(name, fn, before, after, browser) {
  var opts = {
    skip: false
  };

  if (isUndefined(browser)) {
    opts.skip = !inBrowser;
  } else {
    opts.skip = !inBrowser || !browser;
  }

  harness(name, opts, function (t) {
    if(before) before();
    _setupUI(t);
    fn(t);
    if(after) after();
    _teardownUI(t);
  });
};

harness.FF = function(name, fn, before, after) {
  var isFF = platform.isFF;
  harness.UI(name, fn, before, after, isFF);
};

harness.WK = function(name, fn, before, after) {
  var isWebKit = platform.isWebKit;
  harness.UI(name, fn, before, after, isWebKit);
};


module.exports = harness;

/* 
  Helpers 
*/

function _setupUI(t) {
  var fixtureElement = window.document.querySelector('#qunit-fixture');
  if (!fixtureElement) {
    fixtureElement = window.document.createElement('div');
    fixtureElement.id = "qunit-fixture";
    window.document.querySelector('body').appendChild(fixtureElement);
  }
  var sandboxEl = window.document.createElement('div');
  sandboxEl.id = 'sandbox-'+t.test.id;
  fixtureElement.appendChild(sandboxEl);
  t.sandbox = DefaultDOMElement.wrapNativeElement(sandboxEl);
};

function _teardownUI(t) {
  var sandbox = t.sandbox;
  if (sandbox) {
    sandbox.remove();
  }
};
