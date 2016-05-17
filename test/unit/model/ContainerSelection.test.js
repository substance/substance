'use strict';

require('../qunit_extensions');
var simple = require('../../fixtures/simple');
var containerAnnoSample = require('../../fixtures/container_anno_sample');
var Range = require('../../../model/Range');
var Coordinate = require('../../../model/Coordinate');
var ContainerSelection = require('../../../model/ContainerSelection');

QUnit.module('model/ContainerSelection');

QUnit.test("Creating a ContainerSelection", function(assert) {
  var sel = new ContainerSelection('main',['p1', 'content'], 1, ['p2', 'content'], 2);
  assert.ok(sel.isContainerSelection(), 'Should be a container selection.');
  assert.ok(!sel.isNull(), 'Should not be null.');
  assert.deepEqual(sel.startPath, ['p1', 'content'], 'startPath should be correct.');
  assert.equal(sel.startOffset, 1, 'startOffset should be correct.');
  assert.deepEqual(sel.endPath, ['p2', 'content'], 'endPath should be correct.');
  assert.equal(sel.endOffset, 2, 'endOffset should be correct.');
  assert.ok(!sel.isReverse(), 'Selection should not be reverse');
});

QUnit.test("Creating a ContainerSelection using a Range", function(assert) {
  var doc = simple();
  var range = new Range(new Coordinate(['p1', 'content'], 1), new Coordinate(['p2', 'content'], 2), false, 'main');
  var sel = doc.createSelection(range);
  assert.ok(sel.isContainerSelection(), 'Should be a container selection.');
  assert.deepEqual(sel.startPath, ['p1', 'content'], 'startPath should be correct.');
  assert.equal(sel.startOffset, 1, 'startOffset should be correct.');
  assert.deepEqual(sel.endPath, ['p2', 'content'], 'endPath should be correct.');
  assert.equal(sel.endOffset, 2, 'endOffset should be correct.');
  assert.ok(!sel.isReverse(), 'Selection should not be reverse');
});

QUnit.test("Collapsed ContainerSelection", function(assert) {
  var sel = new ContainerSelection('main', ['p1', 'content'], 1, ['p1', 'content'], 1);
  assert.ok(sel.isContainerSelection(), 'Should be a container selection.');
  assert.ok(sel.isCollapsed(), 'Selection should be collapsed.');
});

QUnit.test("Reverse ContainerSelection", function(assert) {
  var sel = new ContainerSelection('main', ['p1', 'content'], 1, ['p1', 'content'], 3, true);
  assert.ok(sel.isReverse(), 'Selection should be reverse.');
});

QUnit.test("isInsideOf: strictly inside other", function(assert) {
  var doc = containerAnnoSample();
  var sel = doc.createSelection({
    type: 'container',
    containerId: 'main',
    startPath: ['p1', 'content'],
    startOffset: 5,
    endPath: ['p3', 'content'],
    endOffset: 4,
  });
  var other = doc.createSelection({
    type: 'container',
    containerId: 'main',
    startPath: ['p1', 'content'],
    startOffset: 4,
    endPath: ['p3', 'content'],
    endOffset: 5,
  });
  assert.ok(sel.isInsideOf(other), 'should be inside');
  assert.ok(sel.isInsideOf(other, true), 'should be strictly inside');
});

QUnit.test("isInsideOf: not-strictly inside other", function(assert) {
  var doc = containerAnnoSample();
  var sel = doc.createSelection({
    type: 'container',
    containerId: 'main',
    startPath: ['p1', 'content'],
    startOffset: 5,
    endPath: ['p3', 'content'],
    endOffset: 4,
  });
  var other = doc.createSelection({
    type: 'container',
    containerId: 'main',
    startPath: ['p1', 'content'],
    startOffset: 5,
    endPath: ['p3', 'content'],
    endOffset: 5,
  });
  assert.ok(sel.isInsideOf(other), 'should be inside');
  assert.notOk(sel.isInsideOf(other, true), 'should not be strictly inside');
});

QUnit.test("isInsideOf: inside a PropertySelection", function(assert) {
  var doc = containerAnnoSample();
  var sel = doc.createSelection({
    type: 'container',
    containerId: 'main',
    startPath: ['p1', 'content'],
    startOffset: 4,
    endPath: ['p1', 'content'],
    endOffset: 6,
  });
  var other = doc.createSelection({
    type: 'property',
    path: ['p1', 'content'],
    startOffset: 1,
    endOffset: 8,
  });
  assert.ok(sel.isInsideOf(other), 'should be inside');
});

QUnit.test("isInsideOf: not inside", function(assert) {
  var doc = containerAnnoSample();
  var other = doc.createSelection({
    type: 'container',
    containerId: 'main',
    startPath: ['p1', 'content'],
    startOffset: 5,
    endPath: ['p3', 'content'],
    endOffset: 5,
  });
  // wrapping
  var sel = doc.createSelection({
    type: 'container',
    containerId: 'main',
    startPath: ['p1', 'content'],
    startOffset: 4,
    endPath: ['p3', 'content'],
    endOffset: 6,
  });
  assert.notOk(sel.isInsideOf(other), 'should not be inside');
  // left-boundary not inside
  sel = doc.createSelection({
    type: 'container',
    containerId: 'main',
    startPath: ['p1', 'content'],
    startOffset: 1,
    endPath: ['p2', 'content'],
    endOffset: 2,
  });
  assert.notOk(sel.isInsideOf(other), 'should not be inside');
  // right-boundary not inside
  sel = doc.createSelection({
    type: 'container',
    containerId: 'main',
    startPath: ['p2', 'content'],
    startOffset: 1,
    endPath: ['p3', 'content'],
    endOffset: 7,
  });
  assert.notOk(sel.isInsideOf(other), 'should not be inside');

  var nullSel = doc.createSelection(null);
  assert.notOk(sel.isInsideOf(nullSel), 'should not be inside null selection');
});

QUnit.test("overlaps with other ContainerSelection", function(assert) {
  var doc = containerAnnoSample();
  var sel = doc.createSelection({
    type: 'container',
    containerId: 'main',
    startPath: ['p1', 'content'],
    startOffset: 4,
    endPath: ['p3', 'content'],
    endOffset: 6,
  });
  // equal
  var other = doc.createSelection({
    type: 'container',
    containerId: 'main',
    startPath: ['p1', 'content'],
    startOffset: 4,
    endPath: ['p3', 'content'],
    endOffset: 6,
  });
  assert.ok(sel.overlaps(other));
  // inside
  other = doc.createSelection({
    type: 'container',
    containerId: 'main',
    startPath: ['p1', 'content'],
    startOffset: 5,
    endPath: ['p3', 'content'],
    endOffset: 5,
  });
  assert.ok(sel.overlaps(other));
  // contained
  other = doc.createSelection({
    type: 'container',
    containerId: 'main',
    startPath: ['p1', 'content'],
    startOffset: 2,
    endPath: ['p3', 'content'],
    endOffset: 8,
  });
  assert.ok(sel.overlaps(other));
  // left
  other = doc.createSelection({
    type: 'container',
    containerId: 'main',
    startPath: ['p1', 'content'],
    startOffset: 2,
    endPath: ['p2', 'content'],
    endOffset: 1,
  });
  assert.ok(sel.overlaps(other));
  // right
  other = doc.createSelection({
    type: 'container',
    containerId: 'main',
    startPath: ['p2', 'content'],
    startOffset: 2,
    endPath: ['p3', 'content'],
    endOffset: 8,
  });
  assert.ok(sel.overlaps(other));
});


QUnit.test("Collapsing to the left", function(assert) {
  var sel = new ContainerSelection('main', ['p1', 'content'], 1, ['p3', 'content'], 3);
  sel = sel.collapse('left');
  assert.ok(sel.isCollapsed(), 'should be collapsed');
  assert.deepEqual(sel.startPath, ['p1', 'content']);
  assert.equal(sel.startOffset, 1);
});

QUnit.test("Collapsing to the right", function(assert) {
  var sel = new ContainerSelection('main', ['p1', 'content'], 1, ['p3', 'content'], 3);
  sel = sel.collapse('right');
  assert.ok(sel.isCollapsed(), 'should be collapsed');
  assert.deepEqual(sel.startPath, ['p3', 'content']);
  assert.equal(sel.startOffset, 3);
});

QUnit.test("Expanding: other is inside", function(assert) {
  var doc = containerAnnoSample();
  var sel = doc.createSelection({
    type: 'container',
    containerId: 'main',
    startPath: ['p1', 'content'],
    startOffset: 5,
    endPath: ['p3', 'content'],
    endOffset: 4,
  });
  var other = doc.createSelection({
    type: 'property',
    path: ['p1', 'content'],
    startOffset: 6,
    endOffset: 8
  });
  var newSel = sel.expand(other);
  assert.ok(newSel.equals(sel), "Selection should not have changed.");
});

QUnit.test("Expand: is inside other", function(assert) {
  var doc = containerAnnoSample();
  var sel = doc.createSelection({
    type: 'container',
    containerId: 'main',
    startPath: ['p1', 'content'],
    startOffset: 5,
    endPath: ['p3', 'content'],
    endOffset: 4,
  });
  var other = doc.createSelection({
    type: 'container',
    containerId: 'main',
    startPath: ['p1', 'content'],
    startOffset: 3,
    endPath: ['p3', 'content'],
    endOffset: 5,
  });
  var newSel = sel.expand(other);
  assert.ok(newSel.equals(other));
});

QUnit.test("Expand right", function(assert) {
  var doc = containerAnnoSample();
  var sel = doc.createSelection({
    type: 'container',
    containerId: 'main',
    startPath: ['p1', 'content'],
    startOffset: 5,
    endPath: ['p3', 'content'],
    endOffset: 4,
  });
  var other = doc.createSelection({
    type: 'container',
    containerId: 'main',
    startPath: ['p2', 'content'],
    startOffset: 1,
    endPath: ['p3', 'content'],
    endOffset: 6,
  });
  var newSel = sel.expand(other);
  assert.ok(newSel.start.equals(sel.start));
  assert.ok(newSel.end.equals(other.end));
});

QUnit.test("Expand left", function(assert) {
  var doc = containerAnnoSample();
  var sel = doc.createSelection({
    type: 'container',
    containerId: 'main',
    startPath: ['p1', 'content'],
    startOffset: 5,
    endPath: ['p3', 'content'],
    endOffset: 4,
  });
  var other = doc.createSelection({
    type: 'container',
    containerId: 'main',
    startPath: ['p1', 'content'],
    startOffset: 1,
    endPath: ['p2', 'content'],
    endOffset: 2,
  });
  var newSel = sel.expand(other);
  assert.ok(newSel.start.equals(other.start));
  assert.ok(newSel.end.equals(sel.end));
});

QUnit.test("Expand left with PropertySelection", function(assert) {
  var doc = containerAnnoSample();
  var sel = doc.createSelection({
    type: 'container',
    containerId: 'main',
    startPath: ['p1', 'content'],
    startOffset: 5,
    endPath: ['p3', 'content'],
    endOffset: 4,
  });
  var other = doc.createSelection({
    type: 'property',
    path: ['p1', 'content'],
    startOffset: 1,
    endOffset: 6
  });
  var newSel = sel.expand(other);
  assert.ok(newSel.start.equals(other.start));
  assert.ok(newSel.end.equals(sel.end));
});

QUnit.test("Expand right with PropertySelection", function(assert) {
  var doc = containerAnnoSample();
  var sel = doc.createSelection({
    type: 'container',
    containerId: 'main',
    startPath: ['p1', 'content'],
    startOffset: 5,
    endPath: ['p3', 'content'],
    endOffset: 4,
  });
  var other = doc.createSelection({
    type: 'property',
    path: ['p3', 'content'],
    startOffset: 1,
    endOffset: 6
  });
  var newSel = sel.expand(other);
  assert.ok(newSel.start.equals(sel.start));
  assert.ok(newSel.end.equals(other.end));
});

QUnit.test("Truncate with other ContainerSelection", function(assert) {
  var doc = containerAnnoSample();
  var sel = doc.createSelection({
    type: 'container',
    containerId: 'main',
    startPath: ['p1', 'content'],
    startOffset: 5,
    endPath: ['p3', 'content'],
    endOffset: 4,
  });
  // left side overlapping
  var other = doc.createSelection({
    type: 'container',
    containerId: 'main',
    startPath: ['p1', 'content'],
    startOffset: 1,
    endPath: ['p2', 'content'],
    endOffset: 1,
  });
  var newSel = sel.truncateWith(other);
  assert.ok(newSel.start.equals(other.end));
  assert.ok(newSel.end.equals(sel.end));
  // right side overlapping
  other = doc.createSelection({
    type: 'container',
    containerId: 'main',
    startPath: ['p2', 'content'],
    startOffset: 1,
    endPath: ['p3', 'content'],
    endOffset: 8,
  });
  newSel = sel.truncateWith(other);
  assert.ok(newSel.start.equals(sel.start));
  assert.ok(newSel.end.equals(other.start));
  // equal
  newSel = sel.truncateWith(sel);
  assert.ok(newSel.isNull());
  // wrapping
  other = doc.createSelection({
    type: 'container',
    containerId: 'main',
    startPath: ['p1', 'content'],
    startOffset: 1,
    endPath: ['p3', 'content'],
    endOffset: 8,
  });
  newSel = sel.truncateWith(other);
  assert.ok(newSel.isNull());
  // left side aligned
  other = doc.createSelection({
    type: 'container',
    containerId: 'main',
    startPath: ['p1', 'content'],
    startOffset: 5,
    endPath: ['p2', 'content'],
    endOffset: 1,
  });
  newSel = sel.truncateWith(other);
  assert.ok(newSel.start.equals(other.end));
  assert.ok(newSel.end.equals(sel.end));
  // right side aligned
  other = doc.createSelection({
    type: 'container',
    containerId: 'main',
    startPath: ['p2', 'content'],
    startOffset: 1,
    endPath: ['p3', 'content'],
    endOffset: 4,
  });
  newSel = sel.truncateWith(other);
  assert.ok(newSel.start.equals(sel.start));
  assert.ok(newSel.end.equals(other.start));
});

QUnit.test("getFragments: start and end are property coordinates (partial)", function(assert) {
  var doc = simple();
  var startPath = ['p1', 'content'];
  var sel = doc.createSelection({
    type: 'container',
    containerId: 'main',
    startPath: startPath,
    startOffset: 1,
    endPath: startPath,
    endOffset: 3
  });
  var fragments = sel.getFragments();
  assert.equal(fragments.length, 1, "Should provide one fragment");
  var fragment = fragments[0];
  assert.ok(fragment.isPropertyFragment(), "... which should be a property fragment");
  assert.ok(fragment.isPartial(), "... and it should be partial");
});

QUnit.test("getFragments: start and end are property coordinates (fully)", function(assert) {
  var doc = simple();
  var startPath = ['p1', 'content'];
  var text = doc.get(startPath);
  var sel = doc.createSelection({
    type: 'container',
    containerId: 'main',
    startPath: startPath,
    startOffset: 0,
    endPath: startPath,
    endOffset: text.length
  });
  var fragments = sel.getFragments();
  assert.equal(fragments.length, 1, "Should provide one fragment");
  var fragment = fragments[0];
  assert.ok(fragment.isPropertyFragment(), "... which should be a property fragment");
  assert.notOk(fragment.isPartial(), "... should not be partial.");
});

QUnit.test("getFragments: start is node coordinate (before) and end is property coordinate (partial)", function(assert) {
  var doc = simple();
  var sel = doc.createSelection({
    type: 'container',
    containerId: 'main',
    startPath: ['p1'],
    startOffset: 0,
    endPath: ['p1', 'content'],
    endOffset: 3
  });
  var fragments = sel.getFragments();
  assert.equal(fragments.length, 1, "Should provide one fragment");
  var fragment = fragments[0];
  assert.ok(fragment.isPropertyFragment(), "... which should be a property fragment");
  assert.ok(fragment.isPartial(), ".... should be partial.");
});

QUnit.test("getFragments: start is node coordinate (before) and end is property coordinate (full)", function(assert) {
  var doc = simple();
  var text = doc.get(['p1', 'content']);
  var sel = doc.createSelection({
    type: 'container',
    containerId: 'main',
    startPath: ['p1'],
    startOffset: 0,
    endPath: ['p1', 'content'],
    endOffset: text.length
  });
  var fragments = sel.getFragments();
  assert.equal(fragments.length, 1, "Should provide one fragment");
  var fragment = fragments[0];
  assert.ok(fragment.isPropertyFragment(), "... which should be a property fragment");
  assert.notOk(fragment.isPartial(), "... should not be partial.");
});

QUnit.test("[Edge case] getFragments: start is node coordinate (after) and end is property coordinate (partial)", function(assert) {
  var doc = simple();
  // this means, the start coordinate is after the end coordinate
  var sel = doc.createSelection({
    type: 'container',
    containerId: 'main',
    startPath: ['p1'],
    startOffset: 1,
    endPath: ['p1', 'content'],
    endOffset: 3
  });
  var fragments = sel.getFragments();
  assert.equal(fragments.length, 1, "Should provide one fragment");
  var fragment = fragments[0];
  assert.ok(fragment.isPropertyFragment(), "... which should be a property fragment");
  assert.ok(fragment.isPartial(), "... should be partial.");
});

QUnit.test("getFragments: start is property coordinate (partial) and end node coordinate", function(assert) {
  var doc = simple();
  var sel = doc.createSelection({
    type: 'container',
    containerId: 'main',
    startPath: ['p1', 'content'],
    startOffset: 1,
    endPath: ['p1'],
    endOffset: 1
  });
  var fragments = sel.getFragments();
  assert.equal(fragments.length, 1, "Should provide one fragment");
  var fragment = fragments[0];
  assert.ok(fragment.isPropertyFragment(), "... which should be a property fragment");
  assert.ok(fragment.isPartial(), "... should be partial");
});

QUnit.test("getFragments: start is property coordinate (full) and end node coordinate", function(assert) {
  var doc = simple();
  var sel = doc.createSelection({
    type: 'container',
    containerId: 'main',
    startPath: ['p1', 'content'],
    startOffset: 0,
    endPath: ['p1'],
    endOffset: 1
  });
  var fragments = sel.getFragments();
  assert.equal(fragments.length, 1, "Should provide one fragment");
  var fragment = fragments[0];
  assert.ok(fragment.isPropertyFragment(), "... which should be a property fragment");
  assert.notOk(fragment.isPartial(), "... should not be partial.");
});

QUnit.test("containsNode: inner node", function(assert) {
  var doc = simple();
  var sel = doc.createSelection({
    type: 'container',
    containerId: 'main',
    startPath: ['p1', 'content'],
    startOffset: 1,
    endPath: ['p3', 'content'],
    endOffset: 3
  });
  assert.ok(sel.containsNode('p2'), 'Should contain p2.');
});

QUnit.test("containsNode: outer nodes", function(assert) {
  var doc = simple();
  var sel = doc.createSelection({
    type: 'container',
    containerId: 'main',
    startPath: ['p2', 'content'],
    startOffset: 1,
    endPath: ['p3', 'content'],
    endOffset: 3
  });
  assert.notOk(sel.containsNode('p1'), 'Should contain p1.');
  assert.notOk(sel.containsNode('p4'), 'Should contain p4.');
});

QUnit.test("containsNode: start/end is nodeFragment", function(assert) {
  var doc = simple();
  var sel = doc.createSelection({
    type: 'container',
    containerId: 'main',
    startPath: ['p1'],
    startOffset: 0,
    endPath: ['p1'],
    endOffset: 1
  });
  assert.ok(sel.containsNode('p1'), 'Should contain node.');
  sel = doc.createSelection({
    type: 'container',
    containerId: 'main',
    startPath: ['p1'],
    startOffset: 0,
    endPath: ['p2'],
    endOffset: 1
  });
  assert.ok(sel.containsNode('p2'), 'Should contain node.');
});

QUnit.test("containsNode: with partial node fragment", function(assert) {
  var doc = simple();
  var sel = doc.createSelection({
    type: 'container',
    containerId: 'main',
    startPath: ['p1'],
    startOffset: 1,
    endPath: ['p2'],
    endOffset: 1
  });
  assert.notOk(sel.containsNode('p1'), 'Should contain node.');
  sel = doc.createSelection({
    type: 'container',
    containerId: 'main',
    startPath: ['p1'],
    startOffset: 0,
    endPath: ['p2'],
    endOffset: 0
  });
  assert.notOk(sel.containsNode('p2'), 'Should contain node.');
});


QUnit.test("[Edge Case] getFragments: start is property coordinate (partial) and end node coordinate (before)", function(assert) {
  var doc = simple();
  var sel = doc.createSelection({
    type: 'container',
    containerId: 'main',
    startPath: ['p1', 'content'],
    startOffset: 1,
    endPath: ['p1'],
    endOffset: 0
  });
  var fragments = sel.getFragments();
  assert.equal(fragments.length, 1, "Should provide one fragment");
  var fragment = fragments[0];
  assert.ok(fragment.isPropertyFragment(), "... which should be a property fragment");
  assert.ok(fragment.isPartial(), "... should be partial");
});

QUnit.test("getFragments: start and end are node coordinates", function(assert) {
  var doc = simple();
  var sel = doc.createSelection({
    type: 'container',
    containerId: 'main',
    startPath: ['p1'],
    startOffset: 0,
    endPath: ['p1'],
    endOffset: 1
  });
  var fragments = sel.getFragments();
  assert.equal(fragments.length, 1, "Should provide one fragment");
  var fragment = fragments[0];
  assert.ok(fragment.isNodeFragment(), "... which should be a property fragment");
});

QUnit.test("[Edge Case] getFragments: start and end are node coordinates (reverse)", function(assert) {
  var doc = simple();
  var sel = doc.createSelection({
    type: 'container',
    containerId: 'main',
    startPath: ['p1'],
    startOffset: 1,
    endPath: ['p1'],
    endOffset: 0
  });
  var fragments = sel.getFragments();
  assert.equal(fragments.length, 1, "Should provide one fragment");
  var fragment = fragments[0];
  assert.ok(fragment.isNodeFragment(), "... which should be a property fragment");
});

QUnit.test("isNodeSelection()", function(assert) {
  var doc = simple();
  // valid NodeSelection
  var sel = doc.createSelection({
    type: 'container',
    containerId: 'main',
    startPath: ['p1'],
    startOffset: 0,
    endPath: ['p1'],
    endOffset: 1
  });
  assert.ok(sel.isNodeSelection(), "selection should be a node selection");
  assert.ok(sel.isEntireNodeSelected(), "selection should be span over the entire node");
  // not a NodeSelection (but within one node)
  sel = doc.createSelection({
    type: 'container',
    containerId: 'main',
    startPath: ['p1'],
    startOffset: 1,
    endPath: ['p1'],
    endOffset: 1
  });
  assert.ok(sel.isNodeSelection(), "selection should be a node selection");
  assert.notOk(sel.isEntireNodeSelected(), "selection should not span over the entire node");
  // not a NodeSelection (is spanning multiple nodes)
  sel = doc.createSelection({
    type: 'container',
    containerId: 'main',
    startPath: ['p1'],
    startOffset: 0,
    endPath: ['p2'],
    endOffset: 1
  });
  assert.notOk(sel.isNodeSelection(), "selection should not be a node selection");
});
