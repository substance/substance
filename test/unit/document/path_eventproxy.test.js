'use strict';

require('../qunit_extensions');
var sample1 = require('../../fixtures/sample1');

QUnit.module('Substance.Document/EventProxy');

QUnit.test("Updating a property", function(assert) {
  var doc = sample1();
  var callCount = 0;
  doc.getEventProxy('path').connect(this, ['test', 'arrayVal'], function() {
    callCount++;
  });
  doc.transaction(function(tx) {
    tx.update(['test', 'arrayVal'], { insert: { offset: 1, value: '1000' } } );
  });
  assert.equal(callCount, 1, "Event proxy listener should have been called.");
});

QUnit.test("Setting a property", function(assert) {
  var doc = sample1();
  var callCount = 0;
  doc.getEventProxy('path').connect(this, ['test', 'arrayVal'], function() {
    callCount++;
  });
  doc.transaction(function(tx) {
    tx.set(['test', 'arrayVal'], [1,1,1]);
  });
  assert.equal(callCount, 1, "Event proxy listener should have been called.");
});

QUnit.test("Setting a property and deleting the node afterwards", function(assert) {
  var doc = sample1();
  var callCount = 0;
  doc.getEventProxy('path').connect(this, ['test', 'arrayVal'], function() {
    callCount++;
  });
  doc.transaction(function(tx) {
    tx.set(['test', 'arrayVal'], [1,1,1]);
    tx.delete('test');
  });
  assert.equal(callCount, 0, "Event proxy listener doesn't get called when node is deleted.");
});
