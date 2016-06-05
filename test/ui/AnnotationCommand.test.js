'use strict';

require('../QUnitExtensions');
var helpers = require('../../model/documentHelpers');
var DocumentSession = require('../../model/DocumentSession');

var AnnotationCommand = require('../../ui/AnnotationCommand');
// var StubSurface = require('./StubSurface');

var createTestArticle = require('../fixtures/createTestArticle');
var containerAnnoSample = require('../fixtures/containerAnnoSample');
// var getAnnos = helpers.getPropertyAnnotationsForSelection;

QUnit.module('ui/AnnotationCommand');

// Setup
// -----------------------

var ToggleStrongCommand = AnnotationCommand.extend({
  static: {
    name: 'toggleStrong',
    annotationType: 'strong'
  }
});

var ToggleContainerAnnoCommand = AnnotationCommand.extend({
  static: {
    name: 'toggleContainerAnno',
    annotationType: 'test-container-anno'
  }
});

function fixture() {
  var doc = createTestArticle(containerAnnoSample);
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

QUnit.test("can 'create' property annotation", function(assert) {
  var doc = fixture();
  var cmd = new ToggleStrongCommand();
  var sel = doc.createSelection({
    type: 'property',
    path: ['p6', 'content'],
    startOffset: 1,
    endOffset: 6
  });
  var cmdState = cmd.getCommandState({
    selection: sel
  });
  assert.equal(cmdState.mode, 'create', "Mode should be correct.");
});

QUnit.test("execute 'create' property annotation", function(assert) {
  var doc = fixture();
  var docSession = new DocumentSession(doc);
  var cmd = new ToggleStrongCommand();
  var sel = doc.createSelection({
    type: 'property',
    path: ['p6', 'content'],
    startOffset: 1,
    endOffset: 6
  });
  var res = cmd.execute({ documentSession: docSession }, {
    mode: 'create',
    selection: sel,
  });
  var newAnno = res.anno;
  assert.isDefinedAndNotNull(newAnno, 'A new anno should have been created');
  newAnno = doc.get(newAnno.id);
  assert.equal(newAnno.type, 'strong', '.. of correct type');
  assert.deepEqual(newAnno.startPath, ['p6', 'content'], ".. with correct path");
  assert.equal(newAnno.startOffset, 1, '.. with correct startOffset');
  assert.equal(newAnno.endOffset, 6, '.. with correct endOffset');
});

QUnit.test("can 'delete' property annotation", function(assert) {
  var doc = fixture();
  var cmd = new ToggleStrongCommand();
  var sel = doc.createSelection(['p1', 'content'], 5, 7);
  var cmdState = cmd.getCommandState({
    selection: sel
  });
  assert.equal(cmdState.mode, 'delete', "Mode should be correct.");
});

QUnit.test("execute 'delete' property annotation", function(assert) {
  var doc = fixture();
  var docSession = new DocumentSession(doc);
  var cmd = new ToggleStrongCommand();
  var sel = doc.createSelection(['p1', 'content'], 5, 7);
  cmd.execute({ documentSession: docSession }, {
    mode: 'delete',
    selection: sel,
  });
  assert.isNullOrUndefined(doc.get('a3'), 'a3 should be gone.');
});

QUnit.test("can 'expand' property annotation", function(assert) {
  var doc = fixture();
  var cmd = new ToggleStrongCommand();
  var sel = doc.createSelection({
    type: 'property',
    path: ['p1', 'content'],
    startOffset: 3,
    endOffset: 8
  });
  var cmdState = cmd.getCommandState({
    selection: sel
  });
  assert.equal(cmdState.mode, 'expand', "Mode should be 'expand'");
});

// QUnit.test("Container Annotation: Toggle on", function(assert) {
//   var doc = fixture();
//   var surface = new StubSurface(doc, 'body');
//   var cmd = new ToggleContainerAnnoCommand({surface: surface});

//   // Selected text 'Paragraph' in p1
//   var sel = doc.createSelection({
//     type: 'container',
//     containerId: 'body',
//     startPath: ['p3', 'content'],
//     startOffset: 7,
//     endPath: ['p4', 'content'],
//     endOffset: 3,
//   });
//   surface.setSelection(sel);

//   // Execute against the provided selection context
//   var res = cmd.execute();
//   var anno = res.anno;

//   assert.equal(anno.type, 'test-container-anno', 'New anno should be of type test-container-anno');
//   var annos = helpers.getAnnotationsForSelection(doc, sel, 'test-container-anno', 'body');
//   assert.equal(annos.length, 1, 'One container anno should be found for sel');
// });



// QUnit.test("Container Annotation: Toggle off", function(assert) {
//   var doc = fixture();
//   var surface = new StubSurface(doc, 'body');
//   var cmd = new ToggleContainerAnnoCommand({surface: surface});

//   // Selected text 'Paragraph' in p1
//   var sel = doc.createSelection({
//     type: 'container',
//     containerId: 'body',
//     startPath: ['p1', 'content'],
//     startOffset: 8,
//     endPath: ['p2', 'content'],
//     endOffset: 2,
//   });
//   surface.setSelection(sel);

//   // Execute against the provided selection context
//   var res = cmd.execute();

//   assert.equal(res.mode, 'delete', "Mode should be 'delete'");
//   assert.equal(res.annoId, 'a1', 'a1 should be affected');
//   assert.isNullOrUndefined(doc.get('a1'), 'a1 should be gone.');

//   var annos = helpers.getAnnotationsForSelection(doc, sel, 'test-container-anno', 'body');
//   assert.equal(annos.length, 0, 'Number of annos should be 0');
// });

// QUnit.test("Container Annotation: Fuse annos", function(assert) {
//   var doc = fixture();
//   var surface = new StubSurface(doc, 'body');
//   var cmd = new ToggleContainerAnnoCommand({surface: surface});

//   // There is already a container anno in the fixture
//   // p1.content[5]...p3.content[4]

//   // Create a second container annotation to be fused
//   // p3.content[6]...p4.content[9]
//   doc.create({
//     type: 'test-container-anno',
//     id: 'a4',
//     container: 'body',
//     startPath: ['p3', 'content'],
//     startOffset: 6,
//     endPath: ['p4', 'content'],
//     endOffset: 9,
//   });
//   // Create a selection that overlaps both of the container annos
//   var sel = doc.createSelection({
//     type: 'container',
//     containerId: 'body',
//     startPath: ['p3', 'content'],
//     startOffset: 1,
//     endPath: ['p3', 'content'],
//     endOffset: 9,
//   });
//   surface.setSelection(sel);

//   // Execute against the provided selection context

//   var res = cmd.execute();
//   var anno = res.anno;

//   assert.equal(res.mode, 'fuse', "Mode should be 'fuse'");
//   assert.equal(anno.type, 'test-container-anno', 'New anno should be of type strong');
//   assert.deepEqual(anno.startPath, ['p1', 'content'], "New anno should have path ['p1', 'content']");
//   assert.deepEqual(anno.endPath, ['p4', 'content'], "New anno should have path ['p4', 'content']");
//   assert.equal(anno.startOffset, 5, 'anno.startOffset should be 5');
//   assert.equal(anno.endOffset, 9, 'anno.endOffset should be 9');

//   var annos = helpers.getAnnotationsForSelection(doc, sel, 'test-container-anno', 'body');
//   assert.equal(annos.length, 1, 'One strong anno should be found for sel');
// });
