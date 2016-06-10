'use strict';

require('../QUnitExtensions');

var fixture = require('../fixtures/createTestArticle');
var simple = require('../fixtures/simple');

QUnit.module('model/Document');

QUnit.test("Create null selection.", function(assert) {
  var doc = fixture(simple);
  var sel = doc.createSelection(null);
  assert.ok(sel.isNull(), 'Selection should be null.');
});

QUnit.test("Create collapsed property selection.", function(assert) {
  var doc = fixture(simple);
  var sel = doc.createSelection(['p1', 'content'], 3);
  assert.ok(sel.isPropertySelection(), 'Selection should be a property selection.');
  assert.ok(sel.isCollapsed(), 'Selection should be collapsed.');
  assert.deepEqual(sel.path, ['p1', 'content'], 'sel.path should be correct.');
  assert.deepEqual(sel.startOffset, 3, 'sel.startOffset should be correct.');
});

QUnit.test("Create expanded property selection.", function(assert) {
  var doc = fixture(simple);
  var sel = doc.createSelection(['p1', 'content'], 1, 4);
  assert.ok(sel.isPropertySelection(), 'Selection should be a property selection.');
  assert.notOk(sel.isCollapsed(), 'Selection should not be collapsed.');
  assert.deepEqual(sel.path, ['p1', 'content'], 'sel.path should be correct.');
  assert.deepEqual(sel.startOffset, 1, 'sel.startOffset should be correct.');
  assert.deepEqual(sel.endOffset, 4, 'sel.endOffset should be correct.');
});
