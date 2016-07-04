'use strict';

var clone = require('lodash/clone');
var extend = require('lodash/extend');
var forEach = require('lodash/forEach');
var isNil = require('lodash/isNil');
var tape = require('tape');
var inBrowser = require('../util/inBrowser');
var platform = require('../util/platform');
var substanceGlobals = require('../util/substanceGlobals');
var DefaultDOMElement = require('../ui/DefaultDOMElement');

var harness = tape;

// extend tape Test
var Test = require('tape/lib/test');

Test.prototype.nil =
Test.prototype.isNil = function (value, msg, extra) {
  this._assert(isNil(value), {
    message : msg,
    operator : 'nil',
    expected : true,
    actual : value,
    extra : extra
  });
};

Test.prototype.notNil =
Test.prototype.isNotNil = function (value, msg, extra) {
  this._assert(!isNil(value), {
    message : msg,
    operator : 'nil',
    expected : true,
    actual : value,
    extra : extra
  });
};

if (inBrowser && substanceGlobals.TEST_UI) {

  // add a tape.Test.reset() that allows to re-run a test
  Test.prototype.reset = function() {
    this.readable = true;
    this.assertCount = 0;
    this.pendingCount = 0;
    this._plan = undefined;
    this._planError = null;
    this._progeny = [];
    this._ok = true;
    this.calledEnd = false;
    this.ended = false;
    this.runtime = -1;
  };

  var _run = Test.prototype.run;
  Test.prototype.run = function() {
    var _ok = false;
    try {
      this.reset();
      var start = Date.now();
      this.once('end', function() {
        this.runtime = Math.round(Date.now() - start);
      }.bind(this));
      _run.apply(this, arguments);
      _ok = true;
    }
    // Using *finally* without *catch* enables us to use browser's
    // 'Stop on uncaught exceptions', but still making sure
    // that 'end' is emitted
    finally {
      if (!_ok) {
        this._ok = false;
        this.emit('end');
      }
    }
  };

  // Using a timeout feels better, as the UI gets updated while
  // it is running.
  // var nextTick = process.nextTick;
  var nextTick = function(f) { window.setTimeout(f, 0); };
  harness = tape.createHarness();
  var results = harness._results;

  harness.runTests = function(tests) {
    tests = tests.slice();
    function next() {
      if (tests.length > 0) {
        var t = tests.shift();
        t.once('end', function(){
          nextTick(next);
        });
        t.run();
      }
    }
    nextTick(next);
  };

  harness.getTests = function() {
    return results.tests || [];
  };
}

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

function _withBeforeAndAfter(tapeish, args) {
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

var defaultExtensions = {
  UI: function() {
    var args = this.getTestArgs(arguments);
    if (!inBrowser) args.opts.skip = true;
    if(inBrowser && !substanceGlobals.TEST_UI) args.opts.setupUI = true;
    return _withBeforeAndAfter(this, args);
  },
  FF: function() {
    var args = this.getTestArgs(arguments);
    if (!inBrowser || !platform.isFF) args.opts.skip = true;
    return this.UI(args.name, args.opts, args.cb);
  },
  WK: function() {
    var args = this.getTestArgs(arguments);
    if (!inBrowser || !platform.isWebKit) args.opts.skip = true;
    return this.UI(args.name, args.opts, args.cb);
  },
};

harness = _addExtensions(defaultExtensions, harness, true);

function _addExtensions(extensions, tapeish, addModule) {

  if (addModule) {
    tapeish.module = function(moduleName) {
      return _addExtensions(extensions, function() {
        var args = getTestArgs.apply(null, arguments);
        var name = moduleName + ": " + args.name;
        var t = tapeish(name, args.opts, args.cb);
        t.moduleName = moduleName;
        return t;
      }, false);
    };
  }

  tapeish.withOptions = function(opts) {
    return _addExtensions(extensions, function() {
      var args = getTestArgs.apply(null, arguments);
      var _opts = extend({}, opts, args.opts);
      return tapeish(args.name, _opts, args.cb);
    });
  };

  tapeish.withExtension = function(name, fn) {
    var exts = clone(extensions);
    exts[name] = fn;
    // wrapping tapeish to create a new tapeish with new extensions
    return _addExtensions(exts, function() {
      return tapeish.apply(tapeish, arguments);
    }, true);
  };

  tapeish.getTestArgs = function(args) {
    return getTestArgs.apply(null, args);
  };

  forEach(extensions, function(fn, name) {
    tapeish[name] = function() {
      return fn.apply(tapeish, arguments);
    };
  });

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
