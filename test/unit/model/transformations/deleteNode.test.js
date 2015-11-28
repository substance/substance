"use strict";

require('../../qunit_extensions');
var containerAnnoSample = require('../../../fixtures/container_anno_sample');
var deleteNode = require('../../../../model/transform/deleteNode');

QUnit.module('model/transform/deleteNode');

QUnit.test("DeleteNode usage", function(assert) {
  var doc = containerAnnoSample();
  assert.throws(function() {
    deleteNode(doc, {});
  });
});

QUnit.test("Delete a plain node", function(assert) {
  var doc = containerAnnoSample();
  doc.transaction(function(tx, args) {
    args.nodeId = "p4";
    deleteNode(tx, args);
  });
  assert.isNullOrUndefined(doc.get('p4'), "Node should have been deleted.");
});

QUnit.test("Delete annotations when deleting a node", function(assert) {
  var doc = containerAnnoSample();
  doc.transaction(function(tx) {
    tx.create({
      id: "test-anno",
      type: "annotation",
      path: ["p4", "content"],
      startOffset: 0, endOffset: 5
    });
  });
  assert.isDefinedAndNotNull(doc.get("test-anno"));

  doc.transaction(function(tx, args) {
    args.nodeId = "p4";
    deleteNode(tx, args);
  });
  assert.isNullOrUndefined(doc.get("test-anno"), "Annotation should have been deleted too.");
});

QUnit.test("Move startAnchor of container annotation to next node.", function(assert) {
  var doc = containerAnnoSample();
  doc.transaction(function(tx, args) {
    args.nodeId = "p1";
    deleteNode(tx, args);
  });
  var anno = doc.get('a1');
  assert.deepEqual(anno.startPath, ["p2", "content"], "Start anchor should now be on second paragraph.");
  assert.equal(anno.startOffset, 0);
});

QUnit.test("Move endAnchor of container annotation to previous node.", function(assert) {
  var doc = containerAnnoSample();
  doc.transaction(function(tx, args) {
    args.nodeId = "p3";
    deleteNode(tx, args);
  });
  var anno = doc.get('a1');
  var p2 = doc.get('p2');
  assert.deepEqual(anno.endPath, ["p2", "content"], "End anchor should now be on second paragraph.");
  assert.equal(anno.endOffset, p2.content.length);
});
