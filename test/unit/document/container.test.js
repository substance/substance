'use strict';

require('../qunit_extensions');
var sample = require('../../fixtures/container_sample');
var simpleSample = require('../../fixtures/sample1');

QUnit.module('Substance.Document/Container');

QUnit.test("Numerical address for simple nodes", function(assert) {
  var doc = sample();
  var container = doc.get('main');
  assert.deepEqual(container.getPropertyAddress(['p1', 'content']), [0,0], "Address of 'p1.content'.");
  assert.deepEqual(container.getPropertyAddress(['p2', 'content']), [1,0], "Address of 'p2.content'.");
  assert.deepEqual(container.getPropertyAddress(['p3', 'content']), [3,0], "Address of 'p3.content'.");
  assert.deepEqual(container.getPropertyAddress(['p4', 'content']), [5,0], "Address of 'p4.content'.");
  assert.deepEqual(container.getPropertyAddress(['p5', 'content']), [7,0], "Address of 'p5.content'.");
});

QUnit.test("Numerical address for structured nodes", function(assert) {
  var doc = sample();
  var container = doc.get('main');
  assert.deepEqual(container.getPropertyAddress(['sn1', 'title']), [2,0], "Address of 'sn1.title'.");
  assert.deepEqual(container.getPropertyAddress(['sn1', 'body']), [2,1], "Address of 'sn1.body'.");
  assert.deepEqual(container.getPropertyAddress(['sn1', 'caption']), [2,2], "Address of 'sn1.caption'.");
});

QUnit.test("Numerical address for nested nodes (list items)", function(assert) {
  var doc = sample();
  var container = doc.get('main');
  assert.deepEqual(container.getPropertyAddress(['li1', 'content']), [4,0,0], "Address of 'li1.content'.");
  assert.deepEqual(container.getPropertyAddress(['li2', 'content']), [4,1,0], "Address of 'li2.content'.");
  assert.deepEqual(container.getPropertyAddress(['li3', 'content']), [4,2,0], "Address of 'li3.content'.");
});

QUnit.test("Numerical address for deeply nested nodes (table cells)", function(assert) {
  var doc = sample();
  var container = doc.get('main');
  assert.deepEqual(container.getPropertyAddress(['td1', 'content']), [6,0,0,0,0], "Address of 'td1.content'.");
  assert.deepEqual(container.getPropertyAddress(['td2', 'content']), [6,0,0,1,0], "Address of 'td2.content'.");
  assert.deepEqual(container.getPropertyAddress(['td3', 'content']), [6,0,0,2,0], "Address of 'td3.content'.");
  assert.deepEqual(container.getPropertyAddress(['td4', 'content']), [6,0,1,0,0], "Address of 'td4.content'.");
  assert.deepEqual(container.getPropertyAddress(['td5', 'content']), [6,0,1,1,0], "Address of 'td5.content'.");
  assert.deepEqual(container.getPropertyAddress(['td6', 'content']), [6,0,1,2,0], "Address of 'td6.content'.");
});

QUnit.test("Property range with simple nodes", function(assert) {
  var doc = simpleSample();
  var container = doc.get('main');
  assert.deepEqual(container.getPropertiesForRange(['h1', 'content'], ['h1', 'content']),
    [['h1', 'content']], 'Property range for start==end should give one path.');
  assert.deepEqual(container.getPropertiesForRange(['h1', 'content'], ['p1', 'content']),
    [['h1', 'content'], ['p1', 'content']], 'Property range for two consecutive paths should give two paths.');
  assert.deepEqual(container.getPropertiesForRange(['h1', 'content'], ['p2', 'content']),
    [['h1', 'content'], ['p1', 'content'], ['h2', 'content'], ['p2', 'content']],
    'Property range for more distant paths should give all spanned paths.');
  assert.deepEqual(container.getPropertiesForRange(['p2', 'content'], ['h1', 'content']),
    [['h1', 'content'], ['p1', 'content'], ['h2', 'content'], ['p2', 'content']],
    'Order of startPath and endPath should not matter.');
});

QUnit.test("Property range with structured nodes", function(assert) {
  var doc = sample();
  var container = doc.get('main');
  assert.deepEqual(container.getPropertiesForRange(['p2', 'content'], ['sn1', 'body']),
    [['p2', 'content'], ['sn1', 'title'], ['sn1', 'body']], 'Property range should cover all spanned properties.');
  assert.deepEqual(container.getPropertiesForRange(['p2', 'content'], ['p3', 'content']),
    [['p2', 'content'], ['sn1', 'title'], ['sn1', 'body'], ['sn1', 'caption'], ['p3', 'content']],
    'Property range should cover all spanned properties.');
});

QUnit.test("Property range with nested nodes", function(assert) {
  var doc = sample();
  var container = doc.get('main');
  assert.deepEqual(container.getPropertiesForRange(['p3', 'content'], ['li2', 'content']),
    [['p3', 'content'], ['li1', 'content'], ['li2', 'content']], 'Property range should cover all spanned properties.');
  assert.deepEqual(container.getPropertiesForRange(['p4', 'content'], ['td2', 'content']),
    [['p4', 'content'], ['td1', 'content'], ['td2', 'content']], 'Property range should cover all spanned properties.');
});
