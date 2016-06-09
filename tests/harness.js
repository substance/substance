'use strict';

var tape = require('tape');
var inBrowser = require('../util/inBrowser');
var platform = require('../util/platform');
var DefaultDOMElement = require('../ui/DefaultDOMElement');

var nextTick = process.nextTick;
var harness = tape.createHarness();
var results = harness._results;

function _onResult(t, res) {
  console.log('Received result for test', t.name, res);
}

harness.runAllTests = function() {
  var i = 0;
  function next() {
    while (i < results.tests.length) {
      var t = results.tests[i++];
      t.once('result', _onResult.bind(null, t));
      t.run();
      if (!t.ended) {
        return t.once('end', function(){ nextTick(next); });
      }
    }
  }
  nextTick(next);
};

harness.module = function(moduleName) {
  var tapeish = function() {
    var args = getTestArgs.apply(null, arguments);
    var name = moduleName + ": " + args.name;
    var t = harness(name, args.opts, args.cb);
    t.moduleName = moduleName;
    return t;
  };
  return _withExtensions(tapeish);
};

_withExtensions(harness);

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

function _withExtensions(tapeish) {

  function _withBeforeAndAfter(args) {
    var _before = args.opts.before;
    var _after = args.opts.after;
    return tapeish(args.name, args.opts, function (t) {
      if(_before) _before(t);
      args.cb(t);
      if(_after) _after(t);
    });
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
    return _withBeforeAndAfter(args);
  };

  tapeish.WK = function() {
    var args = getTestArgs.apply(null, arguments);
    if (!inBrowser || !platform.isWebKit) {
      args.opts.skip = true;
    }
    return _withBeforeAndAfter(args);
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
