'use strict';

var test = require('../test');

var fixture = require('../fixtures/createTestArticle');
var simple = require('../fixtures/simple');

test("Create null selection.", function(t) {
  var doc = fixture(simple);
  var sel = doc.createSelection(null);
  t.ok(sel.isNull(), 'Selection should be null.');
  t.end();
});

test("Create collapsed property selection.", function(t) {
  var doc = fixture(simple);
  var sel = doc.createSelection(['p1', 'content'], 3);
  t.ok(sel.isPropertySelection(), 'Selection should be a property selection.');
  t.ok(sel.isCollapsed(), 'Selection should be collapsed.');
  t.deepEqual(sel.path, ['p1', 'content'], 'sel.path should be correct.');
  t.deepEqual(sel.startOffset, 3, 'sel.startOffset should be correct.');
  t.end();
});

test("Create expanded property selection.", function(t) {
  var doc = fixture(simple);
  var sel = doc.createSelection(['p1', 'content'], 1, 4);
  t.ok(sel.isPropertySelection(), 'Selection should be a property selection.');
  t.notOk(sel.isCollapsed(), 'Selection should not be collapsed.');
  t.deepEqual(sel.path, ['p1', 'content'], 'sel.path should be correct.');
  t.deepEqual(sel.startOffset, 1, 'sel.startOffset should be correct.');
  t.deepEqual(sel.endOffset, 4, 'sel.endOffset should be correct.');
  t.end();
});
