'use strict';

require('../qunit_extensions');
var sample = require('../../fixtures/container_anno_sample');

QUnit.module('Substance.Document/ContainerSelection');

QUnit.test("Expand with PropertySelection", function(assert) {
  var doc = sample();
  var containerSel = doc.createSelection({
    type: 'container',
    containerId: 'main',
    startPath: ['p1', 'content'],
    startOffset: 5,
    endPath: ['p3', 'content'],
    endOffset: 4,
  });
  var propSel = doc.createSelection({
    type: 'property',
    path: ['p1', 'content'],
    startOffset: 1,
    endOffset: 6
  });
  containerSel = containerSel.expand(propSel);
  assert.equal(containerSel.getStartOffset(), 1, "Should expand left boundary to 1.");
});