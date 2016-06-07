var test = require('tape');

var inBrowser = require('../util/inBrowser');
var platform = require('../util/platform');
var DefaultDOMElement = require('../ui/DefaultDOMElement');

function setup(t) {
  if (inBrowser) {
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
};

function teardown(t) {
  if (inBrowser) {
    var sandbox = t.sandbox;
    if (sandbox) {
      sandbox.remove();
    }
  }
};

function UITest(description, fn, before, after) {
  var opts = {
    skip: false
  };

  if (!inBrowser) {
    opts.skip = true;
  }

  test(description, opts, function (t) {
    setup(t);
    if(before) before();
    fn(t);
    teardown(t);
    if(after) after();
  });
};

function FFUITest(description, fn, before, after) {
  var opts = {
    skip: false
  };

  if (!inBrowser || !platform.isFF) {
    opts.skip = true;
  }

  test(description, opts, function (t) {
    setup(t);
    if(before) before();
    fn(t);
    teardown(t);
    if(after) after();
  });
};

function WKUITest(description, fn, before, after) {
  var opts = {
    skip: false
  };

  if (!inBrowser || !platform.isWebkit) {
    opts.skip = true;
  }

  test(description, opts, function (t) {
    setup(t);
    if(before) before();
    fn(t);
    teardown(t);
    if(after) after();
  });
};

module.exports = {
  InBrowser: UITest,
  FF: FFUITest,
  WK: WKUITest
};