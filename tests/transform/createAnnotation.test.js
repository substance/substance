'use strict';

var test = require('tape');

var createAnnotation = require('../../model/transform/createAnnotation');
var docHelpers = require('../../model/documentHelpers');

var fixture = require('../fixtures/createTestArticle');
var headersAndParagraphs = require('../fixtures/headersAndParagraphs');

test("Create property annotation for a given property selection", function(t) {
  var doc = fixture(headersAndParagraphs);

  // Selected text 'Paragraph' in p1
  var sel = doc.createSelection({
    type: 'property',
    path: ['p1', 'content'],
    startOffset: 0,
    endOffset: 9
  });

  // Prepare and perform transformation
  var args = {selection: sel, containerId: 'body', node: {type: 'strong'}};
  var out = createAnnotation(doc, args);

  var anno = out.result;
  t.ok(anno, 'A new annotation should be present');
  t.equal(anno.type, 'strong', 'Anno type should be strong');

  var annoText = out.result.getText();
  var selText = docHelpers.getTextForSelection(doc, sel);
  t.equal(annoText, selText, 'New annotation should have the same text as the original selection');
  t.end();
});

test("Create container annotation for a given container selection", function(t) {
  var doc = fixture(headersAndParagraphs);

  // Selected text 'Paragraph' in p1
  var sel = doc.createSelection({
    type: 'container',
    containerId: 'body',
    startPath: ['p1', 'content'],
    startOffset: 5,
    endPath: ['h2', 'content'],
    endOffset: 4,
  });

  // Prepare and perform transformation
  var args = {selection: sel, containerId: 'body', node: {type: 'test-container-anno'}};
  var out = createAnnotation(doc, args);

  var anno = out.result;
  t.ok(anno, 'A new annotation should be present');
  t.equal(anno.type, 'test-container-anno', 'Anno type should be strong');

  var annoText = out.result.getText();
  var selText = docHelpers.getTextForSelection(doc, sel);
  t.equal(annoText, selText, 'New annotation should have the same text as the original selection');
  t.end();
});
