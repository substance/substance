"use strict";

var TextPropertyManager = require('../../../model/text_property_manager');
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

// For instance, updating a ContainerNode might lead to new rendered
// properties. TextPropertyManager should not process changes for those
// after they could register.
// TODO: this seems a bit hacky still
QUnit.test("TextPropertyManager is updated after other Components.", function(assert) {
  // create a custom manager where onDocumentCHange is inspectable
  manager.dispose();
  TextPropertyManager.prototype.onDocumentChange = sinon.spy(TextPropertyManager.prototype.onDocumentChange);
  manager = new TextPropertyManager(doc, 'main');
  _textProp1();

  var other = sinon.spy();
  // registering another listener, which could be another component, such as ContainerNode
  doc.on('document:changed', other);
  // debugger;
  doc.transaction(function(tx) {
    tx.update(textProp1.path, { "insert": { offset: 0, value: 'a' } } );
  });
  assert.ok(other.calledBefore(manager.onDocumentChange), "TextPropertyManager should have been called later.");
});


// Issue #66: a bug in TextPropertyManager._recordChanges() records
// changes on already deleted nodes
// This happened when there was a node with annotations got deleted
// i.e. the deletion of the annotation was taken as sign to rerender the
// text property
QUnit.test("Issue #66: do not update deleted properties.", function(assert) {
  doc.transaction(function(tx) {
    tx.create({
      id: 's1',
      type: 'strong',
      path: textProp1.path,
      startOffset: 0,
      endOffset: 5
    });
  });
  doc.transaction(function(tx) {
    var id = textProp1.path[0];
    // when deleting a node, the property will unregister itself
    manager.unregisterProperty(textProp1);
    // now we delete the annotation, hide the node, and remove it
    tx.set(['s1', 'startOffset'], 2);
    tx.delete('s1');
    tx.get('main').hide(id);
    tx.delete(id);
  });
  // before #66 was fixed this crashed, as TextPropertyManager
  // was recording the annotation change for the deleted node
  // and trying to update the already removed component.
  assert.ok(true, 'Should not crash.');
});

// Issue #79: TextPropertyManager._recordChanges()  does not record
// changes to ContainerAnnotations correclty
QUnit.test("Issue #79: update on ContainerAnnotation changes.", function(assert) {
  _textProp2();
  _textProp3();
  doc.transaction(function(tx) {
    tx.set(["a1", "startOffset"], 3);
  });
  assert.equal(textProp1.setFragments.callCount, 1, "First property should have been updated.");
});