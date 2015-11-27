'use strict';

var inBrowser = (typeof window !== 'undefined');
var isEmpty = require('lodash/lang/isEmpty');

QUnit.assert.fail = function(msg) {
  this.push(false, false, true, msg);
};

QUnit.assert.isEmpty = function(a, msg) {
  this.push(isEmpty(a), false, true, msg);
};

QUnit.assert.isNullOrUndefined = function(a, msg) {
  this.push((a === null)||(a === undefined), false, true, msg);
};

QUnit.assert.isDefinedAndNotNull = function(a, msg) {
  this.push((a !== null)&&(a !== undefined), false, true, msg);
};

// NOTE: this is a shim, that makes sure that the qunit container is
// present, which was not the case when run in karma.
QUnit.uiModule = function(name, hooks) {
  hooks = hooks || {};
  if (inBrowser) {
    var __beforeEach__ = hooks.beforeEach;
    hooks.beforeEach = function() {
      if (!window.document.querySelector('#qunit-fixture')) {
        var fixtureElement = window.document.createElement('div');
        fixtureElement.id = "qunit-fixture";
        window.document.querySelector('body').appendChild(fixtureElement);
      }
      if (__beforeEach__) {
        __beforeEach__();
      }
    };
  }
  QUnit.module(name, hooks);
};

QUnit.uiTest = function() {
  if (inBrowser) {
    QUnit.test.apply(QUnit.test, arguments);
  }
};

if (inBrowser) {
  // log errors into the console because there source maps are considered
  QUnit.log(function(details) {
    if (details.message && /(Error|Died on)/.exec(details.message)) {
      console.error(details.message);
    }
  });
}
