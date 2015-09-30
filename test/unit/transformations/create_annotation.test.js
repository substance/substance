"use strict";

require('../qunit_extensions');
var sample1 = require('../../fixtures/sample1');

var createAnnotation = require('../../../document/transformations/create_annotation'); 
var docHelpers = require('../../../document/helpers');

QUnit.module('Transformations/createAnnotation');

QUnit.test("Create property annotation for a given property selection", function(assert) {
  var doc = sample1();

  // Selected text 'Paragraph' in p1
  var sel = doc.createSelection({
    type: 'property',
    path: ['p1', 'content'],
    startOffset: 0,
    endOffset: 9
  });

  // Prepare and perform transformation
  var args = {selection: sel, containerId: 'main', annotationType: 'strong'};
  var out = createAnnotation(doc, args);

  var anno = out.result;
  assert.ok(anno, 'A new annotation should be present');
  assert.equal(anno.type, 'strong', 'Anno type should be strong');

  var annoText = out.result.getText();
  var selText = docHelpers.getTextForSelection(doc, sel);
  assert.equal(annoText, selText, 'New annotation should have the same text as the original selection');
});

QUnit.test("Create container annotation for a given container selection", function(assert) {
  var doc = sample1();

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
  var args = {selection: sel, containerId: 'main', annotationType: 'test-container-anno'};
  var out = createAnnotation(doc, args);

  var anno = out.result;
  assert.ok(anno, 'A new annotation should be present');
  assert.equal(anno.type, 'test-container-anno', 'Anno type should be strong');

  var annoText = out.result.getText();
  var selText = docHelpers.getTextForSelection(doc, sel);
  assert.equal(annoText, selText, 'New annotation should have the same text as the original selection');
});
