"use strict";

var test = require('../test');

var insertNode = require('../../model/transform/insertNode');
var DocumentSession = require('../../model/DocumentSession');

var fixture = require('../fixtures/createTestArticle');
var simple = require('../fixtures/simple');

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

test("InsertNode usage", function(t) {
  var doc = fixture(simple);
  // mandatory: containerId, selection, node
  t.throws(function() {
    insertNode(doc, {});
  });
  t.throws(function() {
    insertNode(doc, {selection: true, node: true});
  });
  t.throws(function() {
    insertNode(doc, {containerId: true, node: true});
  });
  t.throws(function() {
    insertNode(doc, {containerId: true, selection: true});
  });
  t.end();
});

test("Insert node should break node.", function(t) {
  var doc = fixture(simple);
  var docSession = new DocumentSession(doc);
  docSession.transaction(function(tx, args) {
    args.containerId = 'body';
    args.selection = doc.createSelection(selectionInFirstParagraph);
    args.node = testNode;
    insertNode(tx, args);
  });
  // the old paragraph should have been split
  var container = doc.get('body');
  var node1 = container.getChildAt(0);
  var node2 = container.getChildAt(1);
  var node3 = container.getChildAt(2);
  t.equal(node1.id, 'p1', "First node should be p1.");
  t.equal(node1.content, '01234', "p1.content should have been truncated correctly.");
  t.equal(node2.id, 'new-node', "Second node should be this inserted node.");
  t.equal(node3.content, '56789', "The tail of p1.content should have been inserted into the 3rd node.");
  t.end();
});

test("Inserting an existing node should be possible", function(t) {
  var doc = fixture(simple);
  var docSession = new DocumentSession(doc);
  docSession.transaction(function(tx, args) {
    tx.create(testNode);
    args.containerId = 'body';
    args.selection = doc.createSelection(selectionInFirstParagraph);
    args.node = testNode;
    insertNode(tx, args);
  });
  t.ok(true, "Should not have thrown.");
  t.end();
});

test("Selection after insert.", function(t) {
  var doc = fixture(simple);
  var sel;
  var docSession = new DocumentSession(doc);
  docSession.transaction(function(tx, args) {
    args.containerId = 'body';
    args.selection = doc.createSelection(selectionInFirstParagraph);
    args.node = testNode;
    var out = insertNode(tx, args);
    sel = out.selection;
  });
  t.ok(sel.isCollapsed(), "Should be collapsed.");
  t.deepEqual(sel.path, ["new-node", "content"], "Cursor should be inside of inserted node.");
  t.equal(sel.startOffset, 0, "Cursor should be at the beginning.");
  t.end();
});
