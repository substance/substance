"use strict";

var TextPropertyManager = require('../../../document/text_property_manager');
var sample = require('../../fixtures/container_anno_sample');

var manager;
var doc;
var textProp1, textProp2, textProp3;

var MockTextProperty = function(path) {
  this.path = path;
  this.setFragments = sinon.spy();
  this.update = sinon.spy();
  this.getPath = function() {
    return this.path;
  };
};

function _textProp1() {
  textProp1 = new MockTextProperty(["p1", "content"]);
  manager.registerProperty(textProp1);
}
function _textProp2() {
  textProp2 = new MockTextProperty(["p2", "content"]);
  manager.registerProperty(textProp2);
}
function _textProp3() {
  textProp3 = new MockTextProperty(["p3", "content"]);
  manager.registerProperty(textProp3);
}

QUnit.module('Substance.Document/TextPropertManager', {
  beforeEach: function() {
    doc = sample();
    manager = new TextPropertyManager(doc, 'main');
    _textProp1();
  },
  afterEach: function() {
    manager = null;
    textProp1 = null;
    textProp2 = null;
    textProp3 = null;
  }
});

QUnit.test("Manager should load existing container annotations.", function(assert) {
  assert.equal(manager.getFragments(['p1', 'content']).length, 1, "There should be one fragment for p1.content.");
  assert.equal(manager.getFragments(['p2', 'content']).length, 1, "There should be one fragment for p2.content.");
  assert.equal(manager.getFragments(['p3', 'content']).length, 1, "There should be one fragment for p3.content.");
});

QUnit.test("Call update when property is updated.", function(assert) {
  doc.transaction(function(tx) {
    tx.update(textProp1.path, { "insert": { offset: 0, value: 'a' } } );
  });
  assert.equal(textProp1.update.callCount, 1, "Property should have been updated.");
});

QUnit.test("Call update when an annotation is created.", function(assert) {
  doc.transaction(function(tx) {
    tx.create({
      id: "test-anno",
      type: "annotation",
      path: textProp1.path,
      startOffset: 0,
      endOffset: 1
    });
  });
  assert.equal(textProp1.update.callCount, 1, "Property should have been updated.");
});

QUnit.test("Call update when an annotation is removed.", function(assert) {
  doc.transaction(function(tx) {
    tx.delete("a2");
  });
  assert.equal(textProp1.update.callCount, 1, "Property should have been updated.");
});

QUnit.test("Call update when an annotation has been updated.", function(assert) {
  doc.transaction(function(tx) {
    tx.set(["a2", "startOffset"], 1);
  });
  assert.equal(textProp1.update.callCount, 1, "Property should have been updated.");
  textProp1.update.reset();
  doc.transaction(function(tx) {
    tx.set(["a2", "endOffset"], 7);
  });
  assert.equal(textProp1.update.callCount, 1, "Property should have been updated.");
});

QUnit.test("Call update when an annotation has been transferred.", function(assert) {
  _textProp2();

  doc.transaction(function(tx) {
    tx.set(["a2", "path"], ["p2", "content"]);
  });
  assert.equal(textProp1.update.callCount, 1, "First property should have been updated.");
  assert.equal(textProp2.update.callCount, 1, "Second component should have been updated.");
});

QUnit.test("Set fragments when a container annotation has been created.", function(assert) {
  _textProp2();
  _textProp3();

  doc.transaction(function(tx) {
    tx.create({
      id: "test-ca",
      type: "test-container-anno",
      container: "main",
      startPath: ["p1", "content"],
      startOffset: 0,
      endPath: ["p3", "content"],
      endOffset: 5
    });
  });
  assert.equal(textProp1.setFragments.callCount, 1, "first.setFragments should have been called.");
  assert.equal(textProp1.setFragments.args[0][0].length, 2, "First property should have received two fragments.");
  assert.equal(textProp2.setFragments.callCount, 1, "second.setFragments should have been called.");
  assert.equal(textProp1.setFragments.args[0][0].length, 2, "Second property should have received two fragments.");
  assert.equal(textProp3.setFragments.callCount, 1, "third.setFragments should have been called.");
  assert.equal(textProp1.setFragments.args[0][0].length, 2, "Second property should have received two fragments.");
});
