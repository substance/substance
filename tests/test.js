'use strict';

var tape = require('tape');
var inBrowser = require('../util/inBrowser');
var platform = require('../util/platform');
var substanceGlobals = require('../util/substanceGlobals');
var DefaultDOMElement = require('../ui/DefaultDOMElement');

var harness = tape;

if (inBrowser && substanceGlobals.TEST_UI) {
  var nextTick = process.nextTick;
  harness = tape.createHarness();
  var results = harness._results;

  results.on('_push', function(t) {
    t.reset = function() {
      this.readable = true;
      this.assertCount = 0;
      this.pendingCount = 0;
      this._plan = undefined;
      this._planError = null;
      this._progeny = [];
      this._ok = true;
      this.calledEnd = false;
      this.ended = false;
    };
  });


  harness.runAllTests = function() {
    var i = 0;
    function next() {
      while (i < results.tests.length) {
        var t = results.tests[i++];
        t.reset();
        t.once('end', function(){ nextTick(next); });
        t.run();
      }
    }
    nextTick(next);
  };

  harness.runTests = function(tests) {
    function next() {
      while (tests.length > 0) {
        var t = tests.shift();
        t.reset();
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
    var _setupUI = args.opts.setupUI;
    return tapeish(args.name, args.opts, function (t) {
      if(_before) _before(t);
      if(_setupUI) _setupSandbox(t);
      args.cb(t);
      if(_setupUI) _teardownSandbox(t);
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
    }
    if(inBrowser && !substanceGlobals.TEST_UI) args.opts.setupUI = true;
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

function _setupSandbox(t) {
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

function _teardownSandbox(t) {
  var sandbox = t.sandbox;
  if (sandbox) {
    sandbox.remove();
  }
}

module.exports = harness;
