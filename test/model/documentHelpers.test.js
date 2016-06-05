'use strict';

require('../QUnitExtensions');
var documentHelpers = require('../../model/documentHelpers');

var fixture = require('../fixtures/createTestArticle');
var simple = require('../fixtures/simple');
var containerAnnoSample = require('../fixtures/containerAnnoSample');

QUnit.module('model/documentHelpers');

QUnit.test("Get text for null selection.", function(assert) {
  var doc = fixture(simple);
  assert.equal(documentHelpers.getTextForSelection(doc, null), "", "Should be empty for null selection.");
  assert.equal(documentHelpers.getTextForSelection(doc, doc.createSelection(null)), "", "Should be empty for null selection.");
});

QUnit.test("Get text for property selection.", function(assert) {
  var doc = fixture(simple);
  var sel = doc.createSelection({
    type: "property",
    path: ["p1", "content"],
    startOffset: 0,
    endOffset: 5
  });
  assert.equal(documentHelpers.getTextForSelection(doc, sel), "01234");
});

QUnit.test("Get text for container selection.", function(assert) {
  var doc = fixture(simple);
  var sel = doc.createSelection({
    type: "container",
    containerId: "body",
    startPath: ["p1", "content"],
    startOffset: 5,
    endPath: ["p2", "content"],
    endOffset: 5
  });
  assert.equal(documentHelpers.getTextForSelection(doc, sel), "56789\n01234");
});

QUnit.test("Get container annotations for property selection.", function(assert) {
  var doc = fixture(containerAnnoSample);
  var container = doc.get('main');
  var sel = doc.createSelection({
    type: 'property',
    path: ['p3', 'content'],
    startOffset: 1,
    endOffset: 6
  });
  var annos;
  // without options
  annos = documentHelpers.getContainerAnnotationsForSelection(doc, sel, container);
  assert.equal(annos.length, 1, 'There should be one container anno');
  var options = {
    type: 'test-container-anno'
  };
  annos = documentHelpers.getContainerAnnotationsForSelection(doc, sel, container, options);
  assert.equal(annos.length, 1, 'There should be one container anno');
});
