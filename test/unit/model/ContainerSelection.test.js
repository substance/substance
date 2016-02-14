'use strict';

require('../qunit_extensions');
var containerAnnoSample = require('../../fixtures/container_anno_sample');
var Selection = require('../../../model/Selection');
var Range = require('../../../model/Range');
var Coordinate = require('../../../model/Coordinate');
var ContainerSelection = require('../../../model/ContainerSelection');

QUnit.module('model/ContainerSelection');

QUnit.test("Creating a ContainerSelection", function(assert) {
  var sel = new ContainerSelection('main',['p1', 'content'], 1, ['p2', 'content'], 2);
  assert.ok(sel.isContainerSelection(), 'Should be a container selection.');
  assert.deepEqual(sel.startPath, ['p1', 'content'], 'startPath should be correct.');
  assert.equal(sel.startOffset, 1, 'startOffset should be correct.');
  assert.deepEqual(sel.endPath, ['p2', 'content'], 'endPath should be correct.');
  assert.equal(sel.endOffset, 2, 'endOffset should be correct.');
  assert.ok(!sel.isReverse(), 'Selection should not be reverse');
});

QUnit.test("Creating a ContainerSelection using a Range", function(assert) {
  var range = new Range(new Coordinate(['p1', 'content'], 1), new Coordinate(['p2', 'content'], 2), false, 'main');
  var sel = new Selection.create(range);
  assert.ok(sel.isContainerSelection(), 'Should be a container selection.');
  assert.deepEqual(sel.startPath, ['p1', 'content'], 'startPath should be correct.');
  assert.equal(sel.startOffset, 1, 'startOffset should be correct.');
  assert.deepEqual(sel.endPath, ['p2', 'content'], 'endPath should be correct.');
  assert.equal(sel.endOffset, 2, 'endOffset should be correct.');
  assert.ok(!sel.isReverse(), 'Selection should not be reverse');
});

QUnit.test("Expand with PropertySelection", function(assert) {
  var doc = containerAnnoSample();
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
  assert.equal(containerSel.startOffset, 1, "Should expand left boundary to 1.");
});
