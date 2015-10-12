'use strict';

require('../qunit_extensions');
var sample = require('../../fixtures/container_sample');

QUnit.module('Substance.Document');

QUnit.test("Get text for null selection.", function(assert) {
  var doc = sample();
  assert.equal(doc.getTextForSelection(null), "", "Should be empty for null selection.");
  assert.equal(doc.getTextForSelection(doc.createSelection(null)), "", "Should be empty for null selection.");
});

QUnit.test("Get text for property selection.", function(assert) {
  var doc = sample();
  var sel = doc.createSelection({
    type: "property",
    path: ["p1", "content"],
    startOffset: 0,
    endOffset: 5
  });
  assert.equal(doc.getTextForSelection(sel), "01234");
});

QUnit.test("Get text for container selection.", function(assert) {
  var doc = sample();
  var sel = doc.createSelection({
    type: "container",
    containerId: "main",
    startPath: ["p1", "content"],
    startOffset: 5,
    endPath: ["p2", "content"],
    endOffset: 5
  });
  assert.equal(doc.getTextForSelection(sel), "5678901234");
});
