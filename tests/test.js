'use strict';

var tape = require('tape');
var inBrowser = require('../util/inBrowser');
var platform = require('../util/platform');
var DefaultDOMElement = require('../ui/DefaultDOMElement');
var substanceGlobals = require('../util/substanceGlobals');

var harness = tape;

if (inBrowser && substanceGlobals.TEST_UI) {
  var nextTick = process.nextTick;
  harness = tape.createHarness();
  var results = harness._results;

  harness.runAllTests = function() {
    var i = 0;
    function next() {
      while (i < results.tests.length) {
        var t = results.tests[i++];
        t.once('end', function(){ nextTick(next); });
        t.run();
      }
    }
    nextTick(next);
  };

  harness.getTests = function() {
    return results.tests || [];
  };
}

_withExtensions(harness, true);

/*
  Helpers
*/

// copied from tape/lib/test.js
function getTestArgs() {
  var name = '(anonymous)';
  var opts = {};
  var cb;
  for (var i = 0; i < arguments.length; i++) {
    var arg = arguments[i];
    var t = typeof arg;
    if (t === 'string') {
      name = arg;
    }
    else if (t === 'object') {
      opts = arg || opts;
    }
    else if (t === 'function') {
      cb = arg;
    }
  }
  return { name: name, opts: opts, cb: cb };
}

function _withExtensions(tapeish, addModule) {

  function _withBeforeAndAfter(args) {
    var _before = args.opts.before;
    var _after = args.opts.after;
    return tapeish(args.name, args.opts, function (t) {
      if(_before) _before(t);
      args.cb(t);
      if(_after) _after(t);
    });
  }

  if (addModule) {
    tapeish.module = function(moduleName) {
      return _withExtensions(function() {
        var args = getTestArgs.apply(null, arguments);
        var name = moduleName + ": " + args.name;
        var t = tapeish(name, args.opts, args.cb);
        t.moduleName = moduleName;
        return t;
      }, false);
    };
  }

  tapeish.UI = function() {
    var args = getTestArgs.apply(null, arguments);
    if (!inBrowser) {
      args.opts.skip = true;
    } else {
      var _before = args.opts.before;
      var _after = args.opts.after;
      args.opts.before = function(t) {
        _setupUI(t);
        if(_before) _before(t);
      };
      args.opts.after = function(t) {
        if(_after) _after(t);
        _teardownUI(t);
      };
    }
    return _withBeforeAndAfter(args);
  };

  tapeish.FF = function() {
    var args = getTestArgs.apply(null, arguments);
    if (!inBrowser || !platform.isFF) {
      args.opts.skip = true;
    }
    return tapeish.UI(args.name, args.opts, args.cb);
  };

  tapeish.WK = function() {
    var args = getTestArgs.apply(null, arguments);
    if (!inBrowser || !platform.isWebKit) {
      args.opts.skip = true;
    }
    return tapeish.UI(args.name, args.opts, args.cb);
  };

  return tapeish;
}

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
}

function _teardownUI(t) {
  var sandbox = t.sandbox;
  if (sandbox) {
    sandbox.remove();
  }
}

module.exports = harness;
