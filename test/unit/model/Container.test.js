'use strict';

require('../qunit_extensions');
var sample = require('../../fixtures/container_sample');
var simpleSample = require('../../fixtures/sample1');
var empty = require('../../fixtures/empty');
var DocumentAddress = require('../../../model/DocumentAddress');
var uuid = require('../../../util/uuid');

QUnit.module('model/Container');

QUnit.assert.isAddressEqual = function(a, b, msg) {
  this.push(DocumentAddress.equal(a, b), false, true, msg);
};

QUnit.test("Numerical address for simple nodes", function(assert) {
  var doc = sample();
  var container = doc.get('main');
  assert.isAddressEqual(container.getAddress(['p1', 'content']), [0,0], "Address of 'p1.content'.");
  assert.isAddressEqual(container.getAddress(['p2', 'content']), [1,0], "Address of 'p2.content'.");
  assert.isAddressEqual(container.getAddress(['p3', 'content']), [3,0], "Address of 'p3.content'.");
  assert.isAddressEqual(container.getAddress(['p4', 'content']), [5,0], "Address of 'p4.content'.");
  assert.isAddressEqual(container.getAddress(['p5', 'content']), [7,0], "Address of 'p5.content'.");
});

QUnit.test("Numerical address for structured nodes", function(assert) {
  var doc = sample();
  var container = doc.get('main');
  assert.isAddressEqual(container.getAddress(['sn1', 'title']), [2,0], "Address of 'sn1.title'.");
  assert.isAddressEqual(container.getAddress(['sn1', 'body']), [2,1], "Address of 'sn1.body'.");
  assert.isAddressEqual(container.getAddress(['sn1', 'caption']), [2,2], "Address of 'sn1.caption'.");
});

QUnit.test("Numerical address for nested nodes (list items)", function(assert) {
  var doc = sample();
  var container = doc.get('main');
  assert.isAddressEqual(container.getAddress(['li1', 'content']), [4,0,0], "Address of 'li1.content'.");
  assert.isAddressEqual(container.getAddress(['li2', 'content']), [4,1,0], "Address of 'li2.content'.");
  assert.isAddressEqual(container.getAddress(['li3', 'content']), [4,2,0], "Address of 'li3.content'.");
});

QUnit.test("Numerical address for deeply nested nodes (table cells)", function(assert) {
  var doc = sample();
  var container = doc.get('main');
  assert.isAddressEqual(container.getAddress(['td1', 'content']), [6,0,0,0,0], "Address of 'td1.content'.");
  assert.isAddressEqual(container.getAddress(['td2', 'content']), [6,0,0,1,0], "Address of 'td2.content'.");
  assert.isAddressEqual(container.getAddress(['td3', 'content']), [6,0,0,2,0], "Address of 'td3.content'.");
  assert.isAddressEqual(container.getAddress(['td4', 'content']), [6,0,1,0,0], "Address of 'td4.content'.");
  assert.isAddressEqual(container.getAddress(['td5', 'content']), [6,0,1,1,0], "Address of 'td5.content'.");
  assert.isAddressEqual(container.getAddress(['td6', 'content']), [6,0,1,2,0], "Address of 'td6.content'.");
});

QUnit.test("Getting next address for simple nodes", function(assert) {
  var doc = sample();
  var container = doc.get('main');
  var next = container.getNextAddress([0,0]);
  assert.isAddressEqual(next, [1,0]);
  next = container.getNextAddress(next);
  assert.isAddressEqual(next, [2,0]);
});

QUnit.test("Getting next address for structured nodes", function(assert) {
  var doc = sample();
  var container = doc.get('main');
  var next = container.getNextAddress([1,0]);
  assert.isAddressEqual(next, [2,0]);
  next = container.getNextAddress(next);
  assert.isAddressEqual(next, [2,1]);
  next = container.getNextAddress(next);
  assert.isAddressEqual(next, [2,2]);
  next = container.getNextAddress(next);
  assert.isAddressEqual(next, [3,0]);
});

QUnit.test("Getting next address for nested nodes (list items)", function(assert) {
  var doc = sample();
  var container = doc.get('main');
  var next = container.getNextAddress([3,0]);
  assert.isAddressEqual(next, [4,0,0]);
  next = container.getNextAddress(next);
  assert.isAddressEqual(next, [4,1,0]);
  next = container.getNextAddress(next);
  assert.isAddressEqual(next, [4,2,0]);
  next = container.getNextAddress(next);
  assert.isAddressEqual(next, [4,3,0]);
  next = container.getNextAddress(next);
  assert.isAddressEqual(next, [5,0]);
});

QUnit.test("Getting next address for deeply nested nodes (table items)", function(assert) {
  var doc = sample();
  var container = doc.get('main');
  var next = container.getNextAddress([5,0]);
  assert.isAddressEqual(next, [6,0,0,0,0]);
  next = container.getNextAddress(next);
  assert.isAddressEqual(next, [6,0,0,1,0]);
  next = container.getNextAddress(next);
  assert.isAddressEqual(next, [6,0,0,2,0]);
  next = container.getNextAddress(next);
  assert.isAddressEqual(next, [6,0,1,0,0]);
  next = container.getNextAddress(next);
  assert.isAddressEqual(next, [6,0,1,1,0]);
  next = container.getNextAddress(next);
  assert.isAddressEqual(next, [6,0,1,2,0]);
  next = container.getNextAddress(next);
  assert.isAddressEqual(next, [7,0]);
});

QUnit.test("Should return null if there is no next address", function(assert) {
  var doc = sample();
  // the last is a simple/structured node
  var container = doc.get('main');
  var next = container.getNextAddress([7,0]);
  assert.equal(next, null);
  // the last is a nested node
  doc.get('main').hide('p5');
  next = container.getNextAddress([6,0,1,2,0]);
  assert.equal(next, null);
});

QUnit.test("Getting previous address for simple nodes", function(assert) {
  var doc = sample();
  var container = doc.get('main');
  var previous = container.getPreviousAddress([2,0]);
  assert.isAddressEqual(previous, [1,0]);
  previous = container.getPreviousAddress(previous);
  assert.isAddressEqual(previous, [0,0]);
});

QUnit.test("Getting previous address for structured nodes", function(assert) {
  var doc = sample();
  var container = doc.get('main');
  var previous = container.getPreviousAddress([3,0]);
  assert.isAddressEqual(previous, [2,2]);
  previous = container.getPreviousAddress(previous);
  assert.isAddressEqual(previous, [2,1]);
  previous = container.getPreviousAddress(previous);
  assert.isAddressEqual(previous, [2,0]);
  previous = container.getPreviousAddress(previous);
  assert.isAddressEqual(previous, [1,0]);
});

QUnit.test("Getting previous address for nested nodes (list items)", function(assert) {
  var doc = sample();
  var container = doc.get('main');
  var previous = container.getPreviousAddress([5,0]);
  assert.isAddressEqual(previous, [4,3,0]);
  previous = container.getPreviousAddress(previous);
  assert.isAddressEqual(previous, [4,2,0]);
  previous = container.getPreviousAddress(previous);
  assert.isAddressEqual(previous, [4,1,0]);
  previous = container.getPreviousAddress(previous);
  assert.isAddressEqual(previous, [4,0,0]);
  previous = container.getPreviousAddress(previous);
  assert.isAddressEqual(previous, [3,0]);
});

QUnit.test("Getting previous address for deeply nested nodes (table items)", function(assert) {
  var doc = sample();
  var container = doc.get('main');
  var previous = container.getPreviousAddress([7,0]);
  assert.isAddressEqual(previous, [6,0,1,2,0]);
  previous = container.getPreviousAddress(previous);
  assert.isAddressEqual(previous, [6,0,1,1,0]);
  previous = container.getPreviousAddress(previous);
  assert.isAddressEqual(previous, [6,0,1,0,0]);
  previous = container.getPreviousAddress(previous);
  assert.isAddressEqual(previous, [6,0,0,2,0]);
  previous = container.getPreviousAddress(previous);
  assert.isAddressEqual(previous, [6,0,0,1,0]);
  previous = container.getPreviousAddress(previous);
  assert.isAddressEqual(previous, [6,0,0,0,0]);
  previous = container.getPreviousAddress(previous);
  assert.isAddressEqual(previous, [5,0]);
});

QUnit.test("Should return null if there is no previous address", function(assert) {
  var doc = sample();
  // the first is a simple/structured node
  var container = doc.get('main');
  var previous = container.getPreviousAddress([0,0]);
  assert.equal(previous, null);
  // the first is a nested node
  var main = doc.get('main');
  main.hide('p1');
  main.hide('p2');
  main.hide('sn1');
  main.hide('p3');
  main.hide('list1');
  main.hide('p4');
  previous = container.getPreviousAddress([0,0,0,0,0]);
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

QUnit.test("Issue #360: Comparing container addresses", function(assert) {
  // The problem revealed by this issue was, that the original comparison
  // implementation made use of the string representation and the natural
  // lexical order, which obviously does not make sense as
  // '21,0' < '3,0'
  var a = new DocumentAddress(3,0);
  var b = new DocumentAddress(21,0);
  assert.ok(a.isBefore(b), "3,0 should be before 21,0");
  assert.notOk(b.isBefore(a), "21,0 should not be before 3,0");
  assert.notOk(a.isEqual(b), "3,0 should be === 21,0");
});

QUnit.test("Issue #360 (II): getting a range of addresses", function(assert) {
  var doc = empty();
  var container = doc.get('main');
  for (var i = 0; i < 25; i++) {
    var p = doc.create({
      type: 'paragraph',
      id: "p" + i,
      content: "XXX"
    });
    container.show(p.id);
  }
  var addresses = container.getAddressRange(new DocumentAddress(0,0), new DocumentAddress(24, 0));
  assert.equal(addresses.length, 25, "There should be 25 addresses");
});

QUnit.test("Addresses for nodes without editable properties.", function(assert) {
  // Nodes without properties should be skipped when dealing with addresses
  var doc = empty();
  var container = doc.get('main');
  var node = doc.create({
    type: 'paragraph',
    id: "p1",
    content: "XXX"
  });
  container.show(node.id);
  var node = doc.create({
    type: 'image',
    id: "img",
    src: "YYY"
  });
  container.show(node.id);
  var node = doc.create({
    type: 'paragraph',
    id: "p2",
    content: "ZZZ"
  });
  container.show(node.id);

  var img = doc.get('img');
  var address = container._getFirstAddress(img);
  assert.isNullOrUndefined(address, "Image does not have an addressable property.");
  address = container.getNextAddress(new DocumentAddress(0,0));
  assert.isAddressEqual(address, [2,0], "Image address should be skipped.");
  var range = container.getAddressRange(new DocumentAddress(1,0), new DocumentAddress(2,0));
  assert.equal(range.length, 2, "There should be 2 addressable properties.");
});
