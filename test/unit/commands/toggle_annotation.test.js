'use strict';

var containerAnnoSample = require('../../fixtures/container_anno_sample');
var ToggleAnnotationCommand = require('../../../ui/commands/toggle_annotation');
var docHelpers = require('../../../document/helpers');
var StubController = require('../ui/stub_controller');

QUnit.module('Commands/toggleAnnotation');

// Setup
// -----------------------

var ToggleStrongCommand = ToggleAnnotationCommand.extend({
  static: {
    name: 'toggleStrong',
    annotationType: 'strong'
  }
});

var ToggleContainerAnnoCommand = ToggleAnnotationCommand.extend({
  static: {
    name: 'toggleContainerAnno',
    annotationType: 'test-container-anno'
  }
});

function sample() {
  var doc = containerAnnoSample();

  // For reference (those are part of the fixture)
  // --------
  //
  // doc.create({
  //   type: 'test-container-anno',
  //   id: 'a1',
  //   container: 'main',
  //   startPath: ['p1', 'content'],
  //   startOffset: 5,
  //   endPath: ['p3', 'content'],
  //   endOffset: 4,
  // });
  // doc.create({
  //   type: 'strong',
  //   id: 'a2',
  //   path: ['p1', 'content'],
  //   startOffset: 0,
  //   endOffset: 2,
  // });

  // Create a second strong annotation to be fused
  doc.create({
    id: 'a3',
    type: 'strong',
    path: ['p1', 'content'],
    startOffset: 4,
    endOffset: 8
  });

  return doc;
}

// Actual tests
// -----------------------

QUnit.test("Property Annotation: Toggle on", function(assert) {
  var doc = sample();

  var sel = doc.createSelection({
    type: 'property',
    path: ['p6', 'content'],
    startOffset: 1,
    endOffset: 6
  });

  var ctrl = new StubController(doc, sel);
  var cmd = new ToggleStrongCommand(ctrl);

  // Execute against the provided selection context

  var res = cmd.execute();
  var anno = res.anno;

  assert.equal(anno.type, 'strong', 'New anno should be of type strong');
  assert.deepEqual(anno.startPath, ['p6', 'content'], "New anno should have path ['p6', 'content']");
  assert.equal(anno.startOffset, 1, 'anno.startOffset should be 1');
  assert.equal(anno.endOffset, 6, 'anno.startOffset should be 6');

  var annos = docHelpers.getAnnotationsForSelection(doc, sel, 'strong', 'main');
  assert.equal(annos.length, 1, 'One strong anno should be found for sel');
});

QUnit.test("Property Annotation: Toggle off", function(assert) {
  var doc = sample();

  var sel = doc.createSelection({
    type: 'property',
    path: ['p1', 'content'],
    startOffset: 5,
    endOffset: 7
  });

  var ctrl = new StubController(doc, sel);
  var cmd = new ToggleStrongCommand(ctrl);

  // Execute against the provided selection context
  var res = cmd.execute();
  assert.equal(res.mode, 'delete', "Mode should be 'delete'");
  assert.equal(res.annoId, 'a3', 'a3 should have been affected by the toggle');
  assert.isNullOrUndefined(doc.get('a3'), 'a3 should be gone.');
});

QUnit.test("Container Annotation: Toggle on", function(assert) {
  var doc = sample();

  // Selected text 'Paragraph' in p1
  var sel = doc.createSelection({
    type: 'container',
    containerId: 'main',
    startPath: ['p3', 'content'],
    startOffset: 7,
    endPath: ['p4', 'content'],
    endOffset: 3,
  });

  var ctrl = new StubController(doc, sel);
  var cmd = new ToggleContainerAnnoCommand(ctrl);

  // Execute against the provided selection context
  var res = cmd.execute();
  var anno = res.anno;

  assert.equal(anno.type, 'test-container-anno', 'New anno should be of type test-container-anno');
  var annos = docHelpers.getAnnotationsForSelection(doc, sel, 'test-container-anno', 'main');
  assert.equal(annos.length, 1, 'One container anno should be found for sel');
});



QUnit.test("Container Annotation: Toggle off", function(assert) {
  var doc = sample();

  // Selected text 'Paragraph' in p1
  var sel = doc.createSelection({
    type: 'container',
    containerId: 'main',
    startPath: ['p1', 'content'],
    startOffset: 8,
    endPath: ['p2', 'content'],
    endOffset: 2,
  });

  var ctrl = new StubController(doc, sel);
  var cmd = new ToggleContainerAnnoCommand(ctrl);

  // Execute against the provided selection context
  var res = cmd.execute();

  assert.equal(res.mode, 'delete', "Mode should be 'delete'");
  assert.equal(res.annoId, 'a1', 'a1 should be affected');
  assert.isNullOrUndefined(doc.get('a1'), 'a1 should be gone.');

  var annos = docHelpers.getAnnotationsForSelection(doc, sel, 'test-container-anno', 'main');
  assert.equal(annos.length, 0, 'Number of annos should be 0');
});

QUnit.test("Container Annotation: Fuse annos", function(assert) {
  var doc = sample();

  // Create a second container annotation to be fused
  doc.create({
    type: 'test-container-anno',
    id: 'a4',
    container: 'main',
    startPath: ['p3', 'content'],
    startOffset: 6,
    endPath: ['p4', 'content'],
    endOffset: 9,
  });

  // Selected text 'Paragraph' in p1
  var sel = doc.createSelection({
    type: 'container',
    containerId: 'main',
    startPath: ['p2', 'content'],
    startOffset: 5,
    endPath: ['p4', 'content'],
    endOffset: 4,
  });

  var ctrl = new StubController(doc, sel);
  var cmd = new ToggleContainerAnnoCommand(ctrl);

  // Execute against the provided selection context

  var res = cmd.execute();
  var anno = res.anno;

  assert.equal(res.mode, 'fuse', "Mode should be 'fuse'");
  assert.equal(anno.type, 'test-container-anno', 'New anno should be of type strong');
  assert.deepEqual(anno.startPath, ['p1', 'content'], "New anno should have path ['p2', 'content']");
  assert.deepEqual(anno.endPath, ['p4', 'content'], "New anno should have path ['p4', 'content']");
  assert.equal(anno.startOffset, 5, 'anno.startOffset should be 5');
  assert.equal(anno.endOffset, 9, 'anno.startOffset should be 9');

  var annos = docHelpers.getAnnotationsForSelection(doc, sel, 'test-container-anno', 'main');
  assert.equal(annos.length, 1, 'One strong anno should be found for sel');
});

