'use strict';

require('../qunit_extensions');
var sample = require('../../fixtures/container_sample');
var simpleSample = require('../../fixtures/sample1');

QUnit.module('model/Container');

QUnit.test("Numerical address for simple nodes", function(assert) {
  var doc = sample();
  var container = doc.get('main');
  assert.deepEqual(container.getAddress(['p1', 'content']), [0,0], "Address of 'p1.content'.");
  assert.deepEqual(container.getAddress(['p2', 'content']), [1,0], "Address of 'p2.content'.");
  assert.deepEqual(container.getAddress(['p3', 'content']), [3,0], "Address of 'p3.content'.");
  assert.deepEqual(container.getAddress(['p4', 'content']), [5,0], "Address of 'p4.content'.");
  assert.deepEqual(container.getAddress(['p5', 'content']), [7,0], "Address of 'p5.content'.");
});

QUnit.test("Numerical address for structured nodes", function(assert) {
  var doc = sample();
  var container = doc.get('main');
  assert.deepEqual(container.getAddress(['sn1', 'title']), [2,0], "Address of 'sn1.title'.");
  assert.deepEqual(container.getAddress(['sn1', 'body']), [2,1], "Address of 'sn1.body'.");
  assert.deepEqual(container.getAddress(['sn1', 'caption']), [2,2], "Address of 'sn1.caption'.");
});

QUnit.test("Numerical address for nested nodes (list items)", function(assert) {
  var doc = sample();
  var container = doc.get('main');
  assert.deepEqual(container.getAddress(['li1', 'content']), [4,0,0], "Address of 'li1.content'.");
  assert.deepEqual(container.getAddress(['li2', 'content']), [4,1,0], "Address of 'li2.content'.");
  assert.deepEqual(container.getAddress(['li3', 'content']), [4,2,0], "Address of 'li3.content'.");
});

QUnit.test("Numerical address for deeply nested nodes (table cells)", function(assert) {
  var doc = sample();
  var container = doc.get('main');
  assert.deepEqual(container.getAddress(['td1', 'content']), [6,0,0,0,0], "Address of 'td1.content'.");
  assert.deepEqual(container.getAddress(['td2', 'content']), [6,0,0,1,0], "Address of 'td2.content'.");
  assert.deepEqual(container.getAddress(['td3', 'content']), [6,0,0,2,0], "Address of 'td3.content'.");
  assert.deepEqual(container.getAddress(['td4', 'content']), [6,0,1,0,0], "Address of 'td4.content'.");
  assert.deepEqual(container.getAddress(['td5', 'content']), [6,0,1,1,0], "Address of 'td5.content'.");
  assert.deepEqual(container.getAddress(['td6', 'content']), [6,0,1,2,0], "Address of 'td6.content'.");
});

QUnit.test("Getting next address for simple nodes", function(assert) {
  var doc = sample();
  var container = doc.get('main');
  var next = container.getNextAddress([0,0]);
  assert.deepEqual(next, [1,0]);
  next = container.getNextAddress(next);
  assert.deepEqual(next, [2,0]);
});

QUnit.test("Getting next address for structured nodes", function(assert) {
  var doc = sample();
  var container = doc.get('main');
  var next = container.getNextAddress([1,0]);
  assert.deepEqual(next, [2,0]);
  next = container.getNextAddress(next);
  assert.deepEqual(next, [2,1]);
  next = container.getNextAddress(next);
  assert.deepEqual(next, [2,2]);
  next = container.getNextAddress(next);
  assert.deepEqual(next, [3,0]);
});

QUnit.test("Getting next address for nested nodes (list items)", function(assert) {
  var doc = sample();
  var container = doc.get('main');
  var next = container.getNextAddress([3,0]);
  assert.deepEqual(next, [4,0,0]);
  next = container.getNextAddress(next);
  assert.deepEqual(next, [4,1,0]);
  next = container.getNextAddress(next);
  assert.deepEqual(next, [4,2,0]);
  next = container.getNextAddress(next);
  assert.deepEqual(next, [4,3,0]);
  next = container.getNextAddress(next);
  assert.deepEqual(next, [5,0]);
});

QUnit.test("Getting next address for deeply nested nodes (table items)", function(assert) {
  var doc = sample();
  var container = doc.get('main');
  var next = container.getNextAddress([5,0]);
  assert.deepEqual(next, [6,0,0,0,0]);
  next = container.getNextAddress(next);
  assert.deepEqual(next, [6,0,0,1,0]);
  next = container.getNextAddress(next);
  assert.deepEqual(next, [6,0,0,2,0]);
  next = container.getNextAddress(next);
  assert.deepEqual(next, [6,0,1,0,0]);
  next = container.getNextAddress(next);
  assert.deepEqual(next, [6,0,1,1,0]);
  next = container.getNextAddress(next);
  assert.deepEqual(next, [6,0,1,2,0]);
  next = container.getNextAddress(next);
  assert.deepEqual(next, [7,0]);
});

QUnit.test("Should return null if there is no next address", function(assert) {
  var doc = sample();
  // the last is a simple/structured node
  var container = doc.get('main');
  var next = container.getNextAddress([7,0]);
  assert.equal(next, null);
  // the last is a nested node
  doc.transaction(function(tx) {
    tx.get('main').hide('p5');
  });
  var next = container.getNextAddress([6,0,1,2,0]);
  assert.equal(next, null);
});

QUnit.test("Getting previous address for simple nodes", function(assert) {
  var doc = sample();
  var container = doc.get('main');
  var previous = container.getPreviousAddress([2,0]);
  assert.deepEqual(previous, [1,0]);
  previous = container.getPreviousAddress(previous);
  assert.deepEqual(previous, [0,0]);
});

QUnit.test("Getting previous address for structured nodes", function(assert) {
  var doc = sample();
  var container = doc.get('main');
  var previous = container.getPreviousAddress([3,0]);
  assert.deepEqual(previous, [2,2]);
  previous = container.getPreviousAddress(previous);
  assert.deepEqual(previous, [2,1]);
  previous = container.getPreviousAddress(previous);
  assert.deepEqual(previous, [2,0]);
  previous = container.getPreviousAddress(previous);
  assert.deepEqual(previous, [1,0]);
});

QUnit.test("Getting previous address for nested nodes (list items)", function(assert) {
  var doc = sample();
  var container = doc.get('main');
  var previous = container.getPreviousAddress([5,0]);
  assert.deepEqual(previous, [4,3,0]);
  previous = container.getPreviousAddress(previous);
  assert.deepEqual(previous, [4,2,0]);
  previous = container.getPreviousAddress(previous);
  assert.deepEqual(previous, [4,1,0]);
  previous = container.getPreviousAddress(previous);
  assert.deepEqual(previous, [4,0,0]);
  previous = container.getPreviousAddress(previous);
  assert.deepEqual(previous, [3,0]);
});

QUnit.test("Getting previous address for deeply nested nodes (table items)", function(assert) {
  var doc = sample();
  var container = doc.get('main');
  var previous = container.getPreviousAddress([7,0]);
  assert.deepEqual(previous, [6,0,1,2,0]);
  previous = container.getPreviousAddress(previous);
  assert.deepEqual(previous, [6,0,1,1,0]);
  previous = container.getPreviousAddress(previous);
  assert.deepEqual(previous, [6,0,1,0,0]);
  previous = container.getPreviousAddress(previous);
  assert.deepEqual(previous, [6,0,0,2,0]);
  previous = container.getPreviousAddress(previous);
  assert.deepEqual(previous, [6,0,0,1,0]);
  previous = container.getPreviousAddress(previous);
  assert.deepEqual(previous, [6,0,0,0,0]);
  previous = container.getPreviousAddress(previous);
  assert.deepEqual(previous, [5,0]);
});

QUnit.test("Should return null if there is no previous address", function(assert) {
  var doc = sample();
  // the first is a simple/structured node
  var container = doc.get('main');
  var previous = container.getPreviousAddress([0,0]);
  assert.equal(previous, null);
  // the first is a nested node
  doc.transaction(function(tx) {
    tx.get('main').hide('p1');
    tx.get('main').hide('p2');
    tx.get('main').hide('sn1');
    tx.get('main').hide('p3');
    tx.get('main').hide('list1');
    tx.get('main').hide('p4');
  });
  var previous = container.getPreviousAddress([0,0,0,0,0]);
  assert.equal(previous, null);
});

QUnit.test("Property range with simple nodes", function(assert) {
  var doc = simpleSample();
  var container = doc.get('main');
  assert.deepEqual(container.getPathRange(['h1', 'content'], ['h1', 'content']),
    [['h1', 'content']], 'Property range for start==end should give one path.');
  assert.deepEqual(container.getPathRange(['h1', 'content'], ['p1', 'content']),
    [['h1', 'content'], ['p1', 'content']], 'Property range for two consecutive paths should give two paths.');
  assert.deepEqual(container.getPathRange(['h1', 'content'], ['p2', 'content']),
    [['h1', 'content'], ['p1', 'content'], ['h2', 'content'], ['p2', 'content']],
    'Property range for more distant paths should give all spanned paths.');
  assert.deepEqual(container.getPathRange(['p2', 'content'], ['h1', 'content']),
    [['h1', 'content'], ['p1', 'content'], ['h2', 'content'], ['p2', 'content']],
    'Order of startPath and endPath should not matter.');
});

QUnit.test("Property range with structured nodes", function(assert) {
  var doc = sample();
  var container = doc.get('main');
  assert.deepEqual(container.getPathRange(['p2', 'content'], ['sn1', 'body']),
    [['p2', 'content'], ['sn1', 'title'], ['sn1', 'body']], 'Property range should cover all spanned properties.');
  assert.deepEqual(container.getPathRange(['p2', 'content'], ['p3', 'content']),
    [['p2', 'content'], ['sn1', 'title'], ['sn1', 'body'], ['sn1', 'caption'], ['p3', 'content']],
    'Property range should cover all spanned properties.');
});

QUnit.test("Property range with nested nodes", function(assert) {
  var doc = sample();
  var container = doc.get('main');
  assert.deepEqual(container.getPathRange(['p3', 'content'], ['li2', 'content']),
    [['p3', 'content'], ['li1', 'content'], ['li2', 'content']], 'Property range should cover all spanned properties.');
  assert.deepEqual(container.getPathRange(['p4', 'content'], ['td2', 'content']),
    [['p4', 'content'], ['td1', 'content'], ['td2', 'content']], 'Property range should cover all spanned properties.');
});
