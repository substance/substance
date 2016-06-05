'use strict';

require('../QUnitExtensions');
var createAnnotation = require('../../model/transform/createAnnotation');
var docHelpers = require('../../model/documentHelpers');

var fixture = require('../fixtures/createTestArticle');
var headersAndParagraphs = require('../fixtures/headersAndParagraphs');

QUnit.module('model/transform/createAnnotation');

QUnit.test("Create property annotation for a given property selection", function(assert) {
  var doc = fixture(headersAndParagraphs);

  // Selected text 'Paragraph' in p1
  var sel = doc.createSelection({
    type: 'property',
    path: ['p1', 'content'],
    startOffset: 0,
    endOffset: 9
  });

  // Prepare and perform transformation
  var args = {selection: sel, containerId: 'main', node: {type: 'strong'}};
  var out = createAnnotation(doc, args);

  var anno = out.result;
  assert.ok(anno, 'A new annotation should be present');
  assert.equal(anno.type, 'strong', 'Anno type should be strong');

  var annoText = out.result.getText();
  var selText = docHelpers.getTextForSelection(doc, sel);
  assert.equal(annoText, selText, 'New annotation should have the same text as the original selection');
});

QUnit.test("Create container annotation for a given container selection", function(assert) {
  var doc = fixture(headersAndParagraphs);

  // Selected text 'Paragraph' in p1
  var sel = doc.createSelection({
    type: 'container',
    containerId: 'main',
    startPath: ['p1', 'content'],
    startOffset: 5,
    endPath: ['h2', 'content'],
    endOffset: 4,
  });

  // Prepare and perform transformation
  var args = {selection: sel, containerId: 'main', node: {type: 'test-container-anno'}};
  var out = createAnnotation(doc, args);

  var anno = out.result;
  assert.ok(anno, 'A new annotation should be present');
  assert.equal(anno.type, 'test-container-anno', 'Anno type should be strong');

  var annoText = out.result.getText();
  var selText = docHelpers.getTextForSelection(doc, sel);
  assert.equal(annoText, selText, 'New annotation should have the same text as the original selection');
});
