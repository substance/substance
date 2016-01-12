"use strict";

require('../../qunit_extensions');
var insertNode = require('../../../../model/transform/insertNode');
var DocumentSession = require('../../../../model/DocumentSession');
var simple = require('../../../fixtures/simple');

QUnit.module('model/transform/insertNode');

var testNode = {
  type: "paragraph",
  id: "new-node",
  content: "new"
};

var selectionInFirstParagraph = {
  type: "property",
  path: ["p1", "content"],
  startOffset: 5, endOffset: 5
};

QUnit.test("InsertNode usage", function(assert) {
  var doc = simple();
  // mandatory: containerId, selection, node
  assert.throws(function() {
    insertNode(doc, {});
  });
  assert.throws(function() {
    insertNode(doc, {selection: true, node: true});
  });
  assert.throws(function() {
    insertNode(doc, {containerId: true, node: true});
  });
  assert.throws(function() {
    insertNode(doc, {containerId: true, selection: true});
  });
});

QUnit.test("Insert node should break node.", function(assert) {
  var doc = simple();
  var docSession = new DocumentSession(doc);
  docSession.transaction(function(tx, args) {
    args.containerId = 'main';
    args.selection = doc.createSelection(selectionInFirstParagraph);
    args.node = testNode;
    insertNode(tx, args);
  });
  // the old paragraph should have been split
  var container = doc.get('main');
  var node1 = container.getChildAt(0);
  var node2 = container.getChildAt(1);
  var node3 = container.getChildAt(2);
  assert.equal(node1.id, 'p1', "First node should be p1.");
  assert.equal(node1.content, '01234', "p1.content should have been truncated correctly.");
  assert.equal(node2.id, 'new-node', "Second node should be this inserted node.");
  assert.equal(node3.content, '56789', "The tail of p1.content should have been inserted into the 3rd node.");
});

QUnit.test("Inserting an existing node should be possible", function(assert) {
  var doc = simple();
  var docSession = new DocumentSession(doc);
  docSession.transaction(function(tx, args) {
    tx.create(testNode);
    args.containerId = 'main';
    args.selection = doc.createSelection(selectionInFirstParagraph);
    args.node = testNode;
    insertNode(tx, args);
  });
  assert.ok(true, "Should not have thrown.");
});

QUnit.test("Selection after insert.", function(assert) {
  var doc = simple();
  var sel;
  var docSession = new DocumentSession(doc);
  docSession.transaction(function(tx, args) {
    args.containerId = 'main';
    args.selection = doc.createSelection(selectionInFirstParagraph);
    args.node = testNode;
    var out = insertNode(tx, args);
    sel = out.selection;
  });
  assert.ok(sel.isCollapsed(), "Should be collapsed.");
  assert.deepEqual(sel.path, ["new-node", "content"], "Cursor should be inside of inserted node.");
  assert.equal(sel.startOffset, 0, "Cursor should be at the beginning.");
});
