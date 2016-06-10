'use strict';

var test = require('../test');

var documentHelpers = require('../../model/documentHelpers');

var fixture = require('../fixtures/createTestArticle');
var simple = require('../fixtures/simple');
var containerAnnoSample = require('../fixtures/containerAnnoSample');

test("Get text for null selection.", function(t) {
  var doc = fixture(simple);
  t.equal(documentHelpers.getTextForSelection(doc, null), "", "Should be empty for null selection.");
  t.equal(documentHelpers.getTextForSelection(doc, doc.createSelection(null)), "", "Should be empty for null selection.");
  t.end();
});

test("Get text for property selection.", function(t) {
  var doc = fixture(simple);
  var sel = doc.createSelection({
    type: "property",
    path: ["p1", "content"],
    startOffset: 0,
    endOffset: 5
  });
  t.equal(documentHelpers.getTextForSelection(doc, sel), "01234");
  t.end();
});

test("Get text for container selection.", function(t) {
  var doc = fixture(simple);
  var sel = doc.createSelection({
    type: "container",
    containerId: "body",
    startPath: ["p1", "content"],
    startOffset: 5,
    endPath: ["p2", "content"],
    endOffset: 5
  });
  t.equal(documentHelpers.getTextForSelection(doc, sel), "56789\n01234");
  t.end();
});

test("Get container annotations for property selection.", function(t) {
  var doc = fixture(containerAnnoSample);
  var sel = doc.createSelection({
    type: 'property',
    path: ['p3', 'content'],
    startOffset: 1,
    endOffset: 6
  });
  var annos;
  // without options
  annos = documentHelpers.getContainerAnnotationsForSelection(doc, sel, 'body');
  t.equal(annos.length, 1, 'There should be one container anno');
  // filtered by type
  annos = documentHelpers.getContainerAnnotationsForSelection(doc, sel, 'body', {
    type: 'test-container-anno'
  });
  t.equal(annos.length, 1, 'There should be one container anno');
  t.end();
});
