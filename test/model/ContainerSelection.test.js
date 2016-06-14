'use strict';

var test = require('../test').module('model/ContainerSelection');

var Range = require('../../model/Range');
var Coordinate = require('../../model/Coordinate');
var ContainerSelection = require('../../model/ContainerSelection');

var fixture = require('../fixtures/createTestArticle');
var simple = require('../fixtures/simple');
var containerAnnoSample = require('../fixtures/containerAnnoSample');

test("Creating a ContainerSelection", function(t) {
  var sel = new ContainerSelection('body',['p1', 'content'], 1, ['p2', 'content'], 2);
  t.ok(sel.isContainerSelection(), 'Should be a container selection.');
  t.ok(!sel.isNull(), 'Should not be null.');
  t.deepEqual(sel.startPath, ['p1', 'content'], 'startPath should be correct.');
  t.equal(sel.startOffset, 1, 'startOffset should be correct.');
  t.deepEqual(sel.endPath, ['p2', 'content'], 'endPath should be correct.');
  t.equal(sel.endOffset, 2, 'endOffset should be correct.');
  t.ok(!sel.isReverse(), 'Selection should not be reverse');
  t.end();
});

test("Creating a ContainerSelection using a Range", function(t) {
  var doc = fixture(simple);
  var range = new Range(new Coordinate(['p1', 'content'], 1), new Coordinate(['p2', 'content'], 2), false, 'body');
  var sel = doc.createSelection(range);
  t.ok(sel.isContainerSelection(), 'Should be a container selection.');
  t.deepEqual(sel.startPath, ['p1', 'content'], 'startPath should be correct.');
  t.equal(sel.startOffset, 1, 'startOffset should be correct.');
  t.deepEqual(sel.endPath, ['p2', 'content'], 'endPath should be correct.');
  t.equal(sel.endOffset, 2, 'endOffset should be correct.');
  t.ok(!sel.isReverse(), 'Selection should not be reverse');
  t.end();
});

test("Collapsed ContainerSelection", function(t) {
  var sel = new ContainerSelection('body', ['p1', 'content'], 1, ['p1', 'content'], 1);
  t.ok(sel.isContainerSelection(), 'Should be a container selection.');
  t.ok(sel.isCollapsed(), 'Selection should be collapsed.');
  t.end();
});

test("Reverse ContainerSelection", function(t) {
  var sel = new ContainerSelection('body', ['p1', 'content'], 1, ['p1', 'content'], 3, true);
  t.ok(sel.isReverse(), 'Selection should be reverse.');
  t.end();
});

test("isInsideOf: strictly inside other", function(t) {
  var doc = fixture(containerAnnoSample);
  var sel = doc.createSelection({
    type: 'container',
    containerId: 'body',
    startPath: ['p1', 'content'],
    startOffset: 5,
    endPath: ['p3', 'content'],
    endOffset: 4,
  });
  var other = doc.createSelection({
    type: 'container',
    containerId: 'body',
    startPath: ['p1', 'content'],
    startOffset: 4,
    endPath: ['p3', 'content'],
    endOffset: 5,
  });
  t.ok(sel.isInsideOf(other), 'should be inside');
  t.ok(sel.isInsideOf(other, true), 'should be strictly inside');
  t.end();
});

test("isInsideOf: not-strictly inside other", function(t) {
  var doc = fixture(containerAnnoSample);
  var sel = doc.createSelection({
    type: 'container',
    containerId: 'body',
    startPath: ['p1', 'content'],
    startOffset: 5,
    endPath: ['p3', 'content'],
    endOffset: 4,
  });
  var other = doc.createSelection({
    type: 'container',
    containerId: 'body',
    startPath: ['p1', 'content'],
    startOffset: 5,
    endPath: ['p3', 'content'],
    endOffset: 5,
  });
  t.ok(sel.isInsideOf(other), 'should be inside');
  t.notOk(sel.isInsideOf(other, true), 'should not be strictly inside');
  t.end();
});

test("isInsideOf: inside a PropertySelection", function(t) {
  var doc = fixture(containerAnnoSample);
  var sel = doc.createSelection({
    type: 'container',
    containerId: 'body',
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
  t.ok(sel.isInsideOf(other), 'should be inside');
  t.end();
});

test("isInsideOf: not inside", function(t) {
  var doc = fixture(containerAnnoSample);
  var other = doc.createSelection({
    type: 'container',
    containerId: 'body',
    startPath: ['p1', 'content'],
    startOffset: 5,
    endPath: ['p3', 'content'],
    endOffset: 5,
  });
  // wrapping
  var sel = doc.createSelection({
    type: 'container',
    containerId: 'body',
    startPath: ['p1', 'content'],
    startOffset: 4,
    endPath: ['p3', 'content'],
    endOffset: 6,
  });
  t.notOk(sel.isInsideOf(other), 'should not be inside');
  // left-boundary not inside
  sel = doc.createSelection({
    type: 'container',
    containerId: 'body',
    startPath: ['p1', 'content'],
    startOffset: 1,
    endPath: ['p2', 'content'],
    endOffset: 2,
  });
  t.notOk(sel.isInsideOf(other), 'should not be inside');
  // right-boundary not inside
  sel = doc.createSelection({
    type: 'container',
    containerId: 'body',
    startPath: ['p2', 'content'],
    startOffset: 1,
    endPath: ['p3', 'content'],
    endOffset: 7,
  });
  t.notOk(sel.isInsideOf(other), 'should not be inside');

  var nullSel = doc.createSelection(null);
  t.notOk(sel.isInsideOf(nullSel), 'should not be inside null selection');
  t.end();
});

test("overlaps with other ContainerSelection", function(t) {
  var doc = fixture(containerAnnoSample);
  var sel = doc.createSelection({
    type: 'container',
    containerId: 'body',
    startPath: ['p1', 'content'],
    startOffset: 4,
    endPath: ['p3', 'content'],
    endOffset: 6,
  });
  // equal
  var other = doc.createSelection({
    type: 'container',
    containerId: 'body',
    startPath: ['p1', 'content'],
    startOffset: 4,
    endPath: ['p3', 'content'],
    endOffset: 6,
  });
  t.ok(sel.overlaps(other));
  // inside
  other = doc.createSelection({
    type: 'container',
    containerId: 'body',
    startPath: ['p1', 'content'],
    startOffset: 5,
    endPath: ['p3', 'content'],
    endOffset: 5,
  });
  t.ok(sel.overlaps(other));
  // contained
  other = doc.createSelection({
    type: 'container',
    containerId: 'body',
    startPath: ['p1', 'content'],
    startOffset: 2,
    endPath: ['p3', 'content'],
    endOffset: 8,
  });
  t.ok(sel.overlaps(other));
  // left
  other = doc.createSelection({
    type: 'container',
    containerId: 'body',
    startPath: ['p1', 'content'],
    startOffset: 2,
    endPath: ['p2', 'content'],
    endOffset: 1,
  });
  t.ok(sel.overlaps(other));
  // right
  other = doc.createSelection({
    type: 'container',
    containerId: 'body',
    startPath: ['p2', 'content'],
    startOffset: 2,
    endPath: ['p3', 'content'],
    endOffset: 8,
  });
  t.ok(sel.overlaps(other));
  t.end();
});


test("Collapsing to the left", function(t) {
  var sel = new ContainerSelection('body', ['p1', 'content'], 1, ['p3', 'content'], 3);
  sel = sel.collapse('left');
  t.ok(sel.isCollapsed(), 'should be collapsed');
  t.deepEqual(sel.startPath, ['p1', 'content']);
  t.equal(sel.startOffset, 1);
  t.end();
});

test("Collapsing to the right", function(t) {
  var sel = new ContainerSelection('body', ['p1', 'content'], 1, ['p3', 'content'], 3);
  sel = sel.collapse('right');
  t.ok(sel.isCollapsed(), 'should be collapsed');
  t.deepEqual(sel.startPath, ['p3', 'content']);
  t.equal(sel.startOffset, 3);
  t.end();
});

test("Expanding: other is inside", function(t) {
  var doc = fixture(containerAnnoSample);
  var sel = doc.createSelection({
    type: 'container',
    containerId: 'body',
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
  t.ok(newSel.equals(sel), "Selection should not have changed.");
  t.end();
});

test("Expand: is inside other", function(t) {
  var doc = fixture(containerAnnoSample);
  var sel = doc.createSelection({
    type: 'container',
    containerId: 'body',
    startPath: ['p1', 'content'],
    startOffset: 5,
    endPath: ['p3', 'content'],
    endOffset: 4,
  });
  var other = doc.createSelection({
    type: 'container',
    containerId: 'body',
    startPath: ['p1', 'content'],
    startOffset: 3,
    endPath: ['p3', 'content'],
    endOffset: 5,
  });
  var newSel = sel.expand(other);
  t.ok(newSel.equals(other));
  t.end();
});

test("Expand right", function(t) {
  var doc = fixture(containerAnnoSample);
  var sel = doc.createSelection({
    type: 'container',
    containerId: 'body',
    startPath: ['p1', 'content'],
    startOffset: 5,
    endPath: ['p3', 'content'],
    endOffset: 4,
  });
  var other = doc.createSelection({
    type: 'container',
    containerId: 'body',
    startPath: ['p2', 'content'],
    startOffset: 1,
    endPath: ['p3', 'content'],
    endOffset: 6,
  });
  var newSel = sel.expand(other);
  t.ok(newSel.start.equals(sel.start));
  t.ok(newSel.end.equals(other.end));
  t.end();
});

test("Expand left", function(t) {
  var doc = fixture(containerAnnoSample);
  var sel = doc.createSelection({
    type: 'container',
    containerId: 'body',
    startPath: ['p1', 'content'],
    startOffset: 5,
    endPath: ['p3', 'content'],
    endOffset: 4,
  });
  var other = doc.createSelection({
    type: 'container',
    containerId: 'body',
    startPath: ['p1', 'content'],
    startOffset: 1,
    endPath: ['p2', 'content'],
    endOffset: 2,
  });
  var newSel = sel.expand(other);
  t.ok(newSel.start.equals(other.start));
  t.ok(newSel.end.equals(sel.end));
  t.end();
});

test("Expand left with PropertySelection", function(t) {
  var doc = fixture(containerAnnoSample);
  var sel = doc.createSelection({
    type: 'container',
    containerId: 'body',
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
  t.ok(newSel.start.equals(other.start));
  t.ok(newSel.end.equals(sel.end));
  t.end();
});

test("Expand right with PropertySelection", function(t) {
  var doc = fixture(containerAnnoSample);
  var sel = doc.createSelection({
    type: 'container',
    containerId: 'body',
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
  t.ok(newSel.start.equals(sel.start));
  t.ok(newSel.end.equals(other.end));
  t.end();
});

test("Truncate with other ContainerSelection", function(t) {
  var doc = fixture(containerAnnoSample);
  var sel = doc.createSelection({
    type: 'container',
    containerId: 'body',
    startPath: ['p1', 'content'],
    startOffset: 5,
    endPath: ['p3', 'content'],
    endOffset: 4,
  });
  // left side overlapping
  var other = doc.createSelection({
    type: 'container',
    containerId: 'body',
    startPath: ['p1', 'content'],
    startOffset: 1,
    endPath: ['p2', 'content'],
    endOffset: 1,
  });
  var newSel = sel.truncateWith(other);
  t.ok(newSel.start.equals(other.end));
  t.ok(newSel.end.equals(sel.end));
  // right side overlapping
  other = doc.createSelection({
    type: 'container',
    containerId: 'body',
    startPath: ['p2', 'content'],
    startOffset: 1,
    endPath: ['p3', 'content'],
    endOffset: 8,
  });
  newSel = sel.truncateWith(other);
  t.ok(newSel.start.equals(sel.start));
  t.ok(newSel.end.equals(other.start));
  // equal
  newSel = sel.truncateWith(sel);
  t.ok(newSel.isNull());
  // wrapping
  other = doc.createSelection({
    type: 'container',
    containerId: 'body',
    startPath: ['p1', 'content'],
    startOffset: 1,
    endPath: ['p3', 'content'],
    endOffset: 8,
  });
  newSel = sel.truncateWith(other);
  t.ok(newSel.isNull());
  // left side aligned
  other = doc.createSelection({
    type: 'container',
    containerId: 'body',
    startPath: ['p1', 'content'],
    startOffset: 5,
    endPath: ['p2', 'content'],
    endOffset: 1,
  });
  newSel = sel.truncateWith(other);
  t.ok(newSel.start.equals(other.end));
  t.ok(newSel.end.equals(sel.end));
  // right side aligned
  other = doc.createSelection({
    type: 'container',
    containerId: 'body',
    startPath: ['p2', 'content'],
    startOffset: 1,
    endPath: ['p3', 'content'],
    endOffset: 4,
  });
  newSel = sel.truncateWith(other);
  t.ok(newSel.start.equals(sel.start));
  t.ok(newSel.end.equals(other.start));
  t.end();
});

test("getFragments: start and end are property coordinates (partial)", function(t) {
  var doc = fixture(simple);
  var startPath = ['p1', 'content'];
  var sel = doc.createSelection({
    type: 'container',
    containerId: 'body',
    startPath: startPath,
    startOffset: 1,
    endPath: startPath,
    endOffset: 3
  });
  var fragments = sel.getFragments();
  t.equal(fragments.length, 1, "Should provide one fragment");
  var fragment = fragments[0];
  t.ok(fragment.isPropertyFragment(), "... which should be a property fragment");
  t.ok(fragment.isPartial(), "... and it should be partial");
  t.end();
});

test("getFragments: start and end are property coordinates (fully)", function(t) {
  var doc = fixture(simple);
  var startPath = ['p1', 'content'];
  var text = doc.get(startPath);
  var sel = doc.createSelection({
    type: 'container',
    containerId: 'body',
    startPath: startPath,
    startOffset: 0,
    endPath: startPath,
    endOffset: text.length
  });
  var fragments = sel.getFragments();
  t.equal(fragments.length, 1, "Should provide one fragment");
  var fragment = fragments[0];
  t.ok(fragment.isPropertyFragment(), "... which should be a property fragment");
  t.notOk(fragment.isPartial(), "... should not be partial.");
  t.end();
});

test("getFragments: start is node coordinate (before) and end is property coordinate (partial)", function(t) {
  var doc = fixture(simple);
  var sel = doc.createSelection({
    type: 'container',
    containerId: 'body',
    startPath: ['p1'],
    startOffset: 0,
    endPath: ['p1', 'content'],
    endOffset: 3
  });
  var fragments = sel.getFragments();
  t.equal(fragments.length, 1, "Should provide one fragment");
  var fragment = fragments[0];
  t.ok(fragment.isPropertyFragment(), "... which should be a property fragment");
  t.ok(fragment.isPartial(), ".... should be partial.");
  t.end();
});

test("getFragments: start is node coordinate (before) and end is property coordinate (full)", function(t) {
  var doc = fixture(simple);
  var text = doc.get(['p1', 'content']);
  var sel = doc.createSelection({
    type: 'container',
    containerId: 'body',
    startPath: ['p1'],
    startOffset: 0,
    endPath: ['p1', 'content'],
    endOffset: text.length
  });
  var fragments = sel.getFragments();
  t.equal(fragments.length, 1, "Should provide one fragment");
  var fragment = fragments[0];
  t.ok(fragment.isPropertyFragment(), "... which should be a property fragment");
  t.notOk(fragment.isPartial(), "... should not be partial.");
  t.end();
});

test("[Edge case] getFragments: start is node coordinate (after) and end is property coordinate (partial)", function(t) {
  var doc = fixture(simple);
  // this means, the start coordinate is after the end coordinate
  var sel = doc.createSelection({
    type: 'container',
    containerId: 'body',
    startPath: ['p1'],
    startOffset: 1,
    endPath: ['p1', 'content'],
    endOffset: 3
  });
  var fragments = sel.getFragments();
  t.equal(fragments.length, 1, "Should provide one fragment");
  var fragment = fragments[0];
  t.ok(fragment.isPropertyFragment(), "... which should be a property fragment");
  t.ok(fragment.isPartial(), "... should be partial.");
  t.end();
});

test("getFragments: start is property coordinate (partial) and end node coordinate", function(t) {
  var doc = fixture(simple);
  var sel = doc.createSelection({
    type: 'container',
    containerId: 'body',
    startPath: ['p1', 'content'],
    startOffset: 1,
    endPath: ['p1'],
    endOffset: 1
  });
  var fragments = sel.getFragments();
  t.equal(fragments.length, 1, "Should provide one fragment");
  var fragment = fragments[0];
  t.ok(fragment.isPropertyFragment(), "... which should be a property fragment");
  t.ok(fragment.isPartial(), "... should be partial");
  t.end();
});

test("getFragments: start is property coordinate (full) and end node coordinate", function(t) {
  var doc = fixture(simple);
  var sel = doc.createSelection({
    type: 'container',
    containerId: 'body',
    startPath: ['p1', 'content'],
    startOffset: 0,
    endPath: ['p1'],
    endOffset: 1
  });
  var fragments = sel.getFragments();
  t.equal(fragments.length, 1, "Should provide one fragment");
  var fragment = fragments[0];
  t.ok(fragment.isPropertyFragment(), "... which should be a property fragment");
  t.notOk(fragment.isPartial(), "... should not be partial.");
  t.end();
});

test("containsNode: inner node", function(t) {
  var doc = fixture(simple);
  var sel = doc.createSelection({
    type: 'container',
    containerId: 'body',
    startPath: ['p1', 'content'],
    startOffset: 1,
    endPath: ['p3', 'content'],
    endOffset: 3
  });
  t.ok(sel.containsNode('p2'), 'Should contain p2.');
  t.end();
});

test("containsNode: outer nodes", function(t) {
  var doc = fixture(simple);
  var sel = doc.createSelection({
    type: 'container',
    containerId: 'body',
    startPath: ['p2', 'content'],
    startOffset: 1,
    endPath: ['p3', 'content'],
    endOffset: 3
  });
  t.notOk(sel.containsNode('p1'), 'Should contain p1.');
  t.notOk(sel.containsNode('p4'), 'Should contain p4.');
  t.end();
});

test("containsNode: start/end is nodeFragment", function(t) {
  var doc = fixture(simple);
  var sel = doc.createSelection({
    type: 'container',
    containerId: 'body',
    startPath: ['p1'],
    startOffset: 0,
    endPath: ['p1'],
    endOffset: 1
  });
  t.ok(sel.containsNode('p1'), 'Should contain node.');
  sel = doc.createSelection({
    type: 'container',
    containerId: 'body',
    startPath: ['p1'],
    startOffset: 0,
    endPath: ['p2'],
    endOffset: 1
  });
  t.ok(sel.containsNode('p2'), 'Should contain node.');
  t.end();
});

test("containsNode: with partial node fragment", function(t) {
  var doc = fixture(simple);
  var sel = doc.createSelection({
    type: 'container',
    containerId: 'body',
    startPath: ['p1'],
    startOffset: 1,
    endPath: ['p2'],
    endOffset: 1
  });
  t.notOk(sel.containsNode('p1'), 'Should contain node.');
  sel = doc.createSelection({
    type: 'container',
    containerId: 'body',
    startPath: ['p1'],
    startOffset: 0,
    endPath: ['p2'],
    endOffset: 0
  });
  t.notOk(sel.containsNode('p2'), 'Should contain node.');
  t.end();
});


test("[Edge Case] getFragments: start is property coordinate (partial) and end node coordinate (before)", function(t) {
  var doc = fixture(simple);
  var sel = doc.createSelection({
    type: 'container',
    containerId: 'body',
    startPath: ['p1', 'content'],
    startOffset: 1,
    endPath: ['p1'],
    endOffset: 0
  });
  var fragments = sel.getFragments();
  t.equal(fragments.length, 1, "Should provide one fragment");
  var fragment = fragments[0];
  t.ok(fragment.isPropertyFragment(), "... which should be a property fragment");
  t.ok(fragment.isPartial(), "... should be partial");
  t.end();
});

test("getFragments: start and end are node coordinates", function(t) {
  var doc = fixture(simple);
  var sel = doc.createSelection({
    type: 'container',
    containerId: 'body',
    startPath: ['p1'],
    startOffset: 0,
    endPath: ['p1'],
    endOffset: 1
  });
  var fragments = sel.getFragments();
  t.equal(fragments.length, 1, "Should provide one fragment");
  var fragment = fragments[0];
  t.ok(fragment.isNodeFragment(), "... which should be a property fragment");
  t.end();
});

test("[Edge Case] getFragments: start and end are node coordinates (reverse)", function(t) {
  var doc = fixture(simple);
  var sel = doc.createSelection({
    type: 'container',
    containerId: 'body',
    startPath: ['p1'],
    startOffset: 1,
    endPath: ['p1'],
    endOffset: 0
  });
  var fragments = sel.getFragments();
  t.equal(fragments.length, 1, "Should provide one fragment");
  var fragment = fragments[0];
  t.ok(fragment.isNodeFragment(), "... which should be a property fragment");
  t.end();
});
