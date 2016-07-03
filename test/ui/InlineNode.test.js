"use strict";

var setup = require('./setupContainerEditor');
var twoParagraphs = require('../fixtures/twoParagraphs');
var insertInlineNode = require('../../model/transform/insertInlineNode');

var test = require('../test').module('ui/InlineNode');

function paragraphsWithInlineNodes(doc) {
  twoParagraphs(doc);
  var sn1 = doc.create({
    type: "structured-node",
    id: "sn",
    title: "ABCDEFG"
  });
  insertInlineNode(doc, {
    selection: doc.createSelection(['p1', 'content'], 2),
    node: {
      type: 'inline-wrapper',
      id: 'in1',
      wrappedNode: sn1.id
    }
  });
  var c = doc.create({
    type: "container",
    id: "c"
  });
  var c_p = doc.create({
    type: 'paragraph',
    id: "c_p",
    content: "ABCDEFG"
  });
  c.show(c_p);
  insertInlineNode(doc, {
    selection: doc.createSelection(['p2', 'content'], 2),
    node: {
      type: 'inline-wrapper',
      id: 'in2',
      wrappedNode: c.id
    }
  });
}

test("InlineNodes should be not selected when selection is null", function(t) {
  var env = setup(paragraphsWithInlineNodes);
  var documentSession = env.documentSession;
  var nodes = env.app.findAll('.sc-inline-node');
  documentSession.setSelection(null);
  nodes.forEach(function(node){
    t.ok(node.isNotSelected(), "node '"+node.getId()+"' should not be selected.");
  });
  t.end();
});

test("InlineNodes should be not selected when selection is somewhere else", function(t) {
  var env = setup(paragraphsWithInlineNodes);
  var documentSession = env.documentSession;
  var nodes = env.app.findAll('.sc-inline-node');
  documentSession.setSelection({
    type: 'property',
    path: ['p1', 'content'],
    startOffset: 5,
    surfaceId: 'body'
  });
  nodes.forEach(function(node){
    t.ok(node.isNotSelected(), "node '"+node.getId()+"' should not be selected.");
  });
  t.end();
});

test("InlineNode should be 'selected' with when the inline node is selected", function(t) {
  var env = setup(paragraphsWithInlineNodes);
  var documentSession = env.documentSession;
  var nodes = env.app.findAll('.sc-inline-node');
  documentSession.setSelection({
    type: 'property',
    path: ['p1', 'content'],
    startOffset: 2,
    endOffset: 3,
    surfaceId: 'body'
  });
  var expected = {
    'body/in1': 'selected',
    'body/in2': undefined,
  };
  nodes.forEach(function(node){
    var id = node.getId();
    t.equal(node.getMode(), expected[id], "node '" + id + "' should be " + (expected[id] || 'not selected') );
  });
  t.end();
});

test("InlineNode should be 'co-selected' when selection is spanning an inline node", function(t) {
  var env = setup(paragraphsWithInlineNodes);
  var documentSession = env.documentSession;
  var nodes = env.app.findAll('.sc-inline-node');
  documentSession.setSelection({
    type: 'property',
    path: ['p1', 'content'],
    startOffset: 1,
    endOffset: 4,
    surfaceId: 'body'
  });
  var expected = {
    'body/in1': 'co-selected',
    'body/in2': undefined,
  };
  nodes.forEach(function(node){
    var id = node.getId();
    t.equal(node.getMode(), expected[id], "node '" + id + "' should be " + (expected[id] || 'not selected') );
  });
  t.end();
});

test("InlineNode should be 'focused' when having the selection", function(t) {
  var env = setup(paragraphsWithInlineNodes, t.sandbox);
  var documentSession = env.documentSession;
  var nodes = env.app.findAll('.sc-inline-node');
  documentSession.setSelection({
    type: 'property',
    path: ['p1', 'content'],
    startOffset: 1,
    endOffset: 4,
    surfaceId: 'body/in1/sn1.title'
  });
  var expected = {
    'body/in1': 'focused',
    'body/in2': undefined,
  };
  nodes.forEach(function(node){
    var id = node.getId();
    t.equal(node.getMode(), expected[id], "node '" + id + "' should be " + (expected[id] || 'not selected') );
  });
  // used this to play with the sandbox after the test was run, e.g. to find out
  // the real surface ids
  // documentSession.on('didUpdate', function(change) {
  //   if (change.selection) {
  //     console.log(change.selection);
  //   }
  // });
  t.end();
});

// Similar to the previous but with another inline node being focused
test("InlineNode should be 'focused' when having the selection (II)", function(t) {
  var env = setup(paragraphsWithInlineNodes, t.sandbox);
  var documentSession = env.documentSession;
  var nodes = env.app.findAll('.sc-inline-node');
  documentSession.setSelection({
    type: 'property',
    path: ['c_p', 'content'],
    startOffset: 1,
    endOffset: 4,
    surfaceId: 'body/in2/c'
  });
  var expected = {
    'body/in1': undefined,
    'body/in2': 'focused',
  };
  nodes.forEach(function(node){
    var id = node.getId();
    t.equal(node.getMode(), expected[id], "node '" + id + "' should be " + (expected[id] || 'not selected') );
  });
  t.end();
});

// co-focusing an inline node is only possible, if the inline node itself contains
// content with an inline node (or isolated node)
function nestedInlineNode(doc) {
  twoParagraphs(doc);
  var sn1 = doc.create({
    type: "structured-node",
    id: "sn1",
    title: "ABCDEFG"
  });
  insertInlineNode(doc, {
    selection: doc.createSelection(['p1', 'content'], 2),
    node: {
      type: 'inline-wrapper',
      id: 'in1',
      wrappedNode: sn1.id
    }
  });
  var sn2 = doc.create({
    type: "structured-node",
    id: "sn2",
    title: "ABCDEFG"
  });
  insertInlineNode(doc, {
    selection: doc.createSelection(['sn1', 'title'], 4),
    node: {
      type: 'inline-wrapper',
      id: 'in2',
      wrappedNode: sn2.id
    }
  });
}

test("InlineNode should be 'co-focused' when a nested inline node has the selection", function(t) {
  var env = setup(nestedInlineNode, t.sandbox);
  var documentSession = env.documentSession;
  var nodes = env.app.findAll('.sc-inline-node');
  documentSession.setSelection({
    type: 'property',
    path: ['sn2', 'title'],
    startOffset: 2,
    surfaceId: 'body/in1/sn1.title/in2'
  });
  var expected = {
    'body/in1': 'co-focused',
    'body/in1/sn1.title/in2': 'focused',
  };
  nodes.forEach(function(node){
    var id = node.getId();
    t.equal(node.getMode(), expected[id], "node '" + id + "' should be " + (expected[id] || 'not selected') );
  });
  t.end();
});
