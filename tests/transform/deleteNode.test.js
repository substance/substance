"use strict";

var test = require('../test');

var DocumentSession = require('../../model/DocumentSession');
var deleteNode = require('../../model/transform/deleteNode');

var fixture = require('../fixtures/createTestArticle');
var containerAnnoSample = require('../fixtures/containerAnnoSample');

var isNull = require('lodash/isNull');
var isUndefined = require('lodash/isUndefined');

function isNullOrUndefined(t, x, msg) {
  return t.ok(isNull(x) || isUndefined(x), msg);
}

function isDefinedAndNotNull(t, x, msg) {
  return t.ok(!isNull(x) && !isUndefined(x), msg);
}

test("Delete a plain node", function(t) {
  var doc = fixture(containerAnnoSample);
  var docSession = new DocumentSession(doc);
  docSession.transaction(function(tx, args) {
    args.nodeId = "p4";
    deleteNode(tx, args);
  });
  isNullOrUndefined(t, doc.get('p4'), "Node should have been deleted.");
  t.end();
});

test("Delete annotations when deleting a node", function(t) {
  var doc = fixture(containerAnnoSample);
  var docSession = new DocumentSession(doc);
  docSession.transaction(function(tx) {
    tx.create({
      id: "test-anno",
      type: "annotation",
      path: ["p4", "content"],
      startOffset: 0, endOffset: 5
    });
  });
  isDefinedAndNotNull(t, doc.get("test-anno"));

  docSession.transaction(function(tx, args) {
    args.nodeId = "p4";
    deleteNode(tx, args);
  });
 isNullOrUndefined(t, doc.get("test-anno"), "Annotation should have been deleted too.");
  t.end();
});

test("Move startAnchor of container annotation to next node.", function(t) {
  var doc = fixture(containerAnnoSample);
  var docSession = new DocumentSession(doc);
  docSession.transaction(function(tx, args) {
    args.nodeId = "p1";
    deleteNode(tx, args);
  });
  var anno = doc.get('a1');
  t.deepEqual(anno.startPath, ["p2", "content"], "Start anchor should now be on second paragraph.");
  t.equal(anno.startOffset, 0);
  t.end();
});

test("Move endAnchor of container annotation to previous node.", function(t) {
  var doc = fixture(containerAnnoSample);
  var docSession = new DocumentSession(doc);
  docSession.transaction(function(tx, args) {
    args.nodeId = "p3";
    deleteNode(tx, args);
  });
  var anno = doc.get('a1');
  var p2 = doc.get('p2');
  t.deepEqual(anno.endPath, ["p2", "content"], "End anchor should now be on second paragraph.");
  t.equal(anno.endOffset, p2.content.length);
  t.end();
});
