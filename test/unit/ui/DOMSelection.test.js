"use strict";

/* jshint latedef:nofunc */

require('../qunit_extensions');

var isArray = require('lodash/isArray');
var DOMSelection = require('../../../ui/DOMSelection');
var TextPropertyComponent = require('../../../ui/TextPropertyComponent');
var Document = require('../../../model/Document');
var ContainerSelection = require('../../../model/ContainerSelection');
var $ = require('../../../util/jquery');

QUnit.uiModule('ui/DOMSelection');

function StubDoc() {}

StubDoc.prototype.get = function(path) {
  var pathStr = path;
  if (isArray(path)) {
    pathStr = path.join('.');
  }
  var el = window.document.body.querySelector('*[data-path="'+pathStr+'"]');
  if (!el) {
    return "";
  }
  return el.textContent;
};

StubDoc.prototype.createSelection = Document.prototype.createSelection;

function StubSurface(el, containerId) {
  this.el = el;
  this.doc = new StubDoc();
  this.containerId = containerId;

  this.getDocument = function() {
    return this.doc;
  };

  this.isContainerEditor = function() {
    return !!this.containerId;
  };

  this.getContainerId = function() {
    return this.containerId;
  };

  this._getTextPropertyComponent = function(path) {
    var pathStr = path;
    if (isArray(path)) {
      pathStr = path.join('.');
    }
    var el = window.document.body.querySelector('*[data-path="'+pathStr+'"]');
    if (!el) {
      return null;
    }
    return new StubTextPropertyComponent(el);
  };
}

function StubTextPropertyComponent(el) {
  this.el = el;

  this.getDOMCoordinate = TextPropertyComponent.prototype.getDOMCoordinate;

  this._getDOMCoordinate = TextPropertyComponent.prototype._getDOMCoordinate;
}

// Fixtures
var singlePropertyFixture = [
  '<div id="test1">',
    '<span data-path="test1.content">Hello World!</span>',
  '</div>'
].join('');

var mixedFixture = [
  '<div id="before">Before</div>',
  '<div id="test1">',
    '<span data-path="test1.content">The first property.</span>',
  '</div>',
  '<div id="test2">',
    '<span data-path="test2.content">The second property.</span>',
  '</div>',
  '<div id="between">Between</div>',
  '<div id="test3">',
    '<span data-path="test3.content">The third property.</span>',
  '</div>',
  '<div id="test4">',
    '<span data-path="test4.content">The forth property.</span>',
  '</div>',
  '<div id="after">After</div>'
].join('');

QUnit.uiTest("Get coordinate for collapsed selection", function(assert) {
  var el = $('#qunit-fixture').html(singlePropertyFixture)[0];
  var domSelection = new DOMSelection(new StubSurface(el));
  var node = el.querySelector('#test1').childNodes[0].childNodes[0];
  var offset = 5;
  var coor = domSelection._getCoordinate(node, offset);
  assert.ok(coor, "Extracted coordinate should be !== null");
  assert.deepEqual(coor.path, ['test1', 'content'], 'Path should be extracted correctly.');
  assert.equal(coor.offset, 5, 'Offset should be extracted correctly.');
});

QUnit.uiTest("Search coordinate (before)", function(assert) {
  var el = $('#qunit-fixture').html(mixedFixture)[0];
  var domSelection = new DOMSelection(new StubSurface(el));
  var node = el.querySelector('#before').childNodes[0];
  var offset = 1;
  var coor = domSelection._searchForCoordinate(node, offset, {});
  assert.ok(coor, "Extracted coordinate should be !== null");
  assert.deepEqual(coor.path, ['test1', 'content'], 'Path should be extracted correctly.');
  assert.equal(coor.offset, 0, 'Offset should be extracted correctly.');
});

QUnit.uiTest("Search coordinate (between)", function(assert) {
  var el = $('#qunit-fixture').html(mixedFixture)[0];
  var domSelection = new DOMSelection(new StubSurface(el));
  var node = el.querySelector('#between').childNodes[0];
  var offset = 1;
  var coor = domSelection._searchForCoordinate(node, offset, {});
  assert.ok(coor, "Extracted coordinate should be !== null");
  assert.deepEqual(coor.path, ['test3', 'content'], 'Path should be extracted correctly.');
  assert.equal(coor.offset, 0, 'Offset should be extracted correctly.');
});

QUnit.uiTest("Search coordinate (between, left)", function(assert) {
  var el = $('#qunit-fixture').html(mixedFixture)[0];
  var domSelection = new DOMSelection(new StubSurface(el));
  var node = el.querySelector('#between').childNodes[0];
  var offset = 1;
  var coor = domSelection._searchForCoordinate(node, offset, {direction: 'left'});
  assert.ok(coor, "Extracted coordinate should be !== null");
  assert.deepEqual(coor.path, ['test2', 'content'], 'Path should be extracted correctly.');
  assert.equal(coor.offset, 20, 'Offset should be extracted correctly.');
});

QUnit.uiTest("Search coordinate (after)", function(assert) {
  var el = $('#qunit-fixture').html(mixedFixture)[0];
  var domSelection = new DOMSelection(new StubSurface(el));
  var node = el.querySelector('#after').childNodes[0];
  var offset = 1;
  var coor = domSelection._searchForCoordinate(node, offset, {direction: 'left'});
  assert.ok(coor, "Extracted coordinate should be !== null");
  assert.deepEqual(coor.path, ['test3', 'content'], 'Path should be extracted correctly.');
  assert.equal(coor.offset, 19, 'Offset should be extracted correctly.');
});

QUnit.uiTest("coordinate via search", function(assert) {
  var el = $('#qunit-fixture').html(mixedFixture)[0];
  var domSelection = new DOMSelection(new StubSurface(el));
  var node = el.querySelector('#between').childNodes[0];
  var offset = 1;
  var coor = domSelection._searchForCoordinate(node, offset);
  assert.ok(coor, "Extracted coordinate should be !== null");
  assert.deepEqual(coor.path, ['test3', 'content'], 'Path should be extracted correctly.');
  assert.equal(coor.offset, 0, 'Offset should be extracted correctly.');
});

var emptyParagraphFixture = [
  '<div id="test1" class="content-node" data-id="test1">',
    '<span data-path="test1.content"></span>',
  '</div>'
].join('');

QUnit.uiTest("DOM coordinate in empty paragraph", function(assert) {
  var el = $('#qunit-fixture').html(emptyParagraphFixture)[0];
  var domSelection = new DOMSelection(new StubSurface(el));
  var node = el.querySelector('#test1');
  var offset = 0;
  var coor = domSelection._getCoordinate(node, offset);
  assert.ok(coor, "Extracted coordinate should be !== null");
  assert.deepEqual(coor.path, ['test1', 'content'], 'Path should be extracted correctly.');
  assert.equal(coor.offset, 0, 'Offset should be extracted correctly.');
});

var textWithAnnotations = [
  '<div id="test1">',
    '<span id="test1_content" data-path="test1.content">',
      '<span data-offset="0" data-length="2">..</span>',
      '<span data-offset="2" data-length="2">..</span>',
      '<span data-offset="4" data-length="2">..</span>',
      '<span data-offset="6" data-length="2">..</span>',
    '</span>',
  '</div>'
].join('');

QUnit.uiTest("DOM coordinate on text property level (first)", function(assert) {
  var el = $('#qunit-fixture').html(textWithAnnotations)[0];
  var domSelection = new DOMSelection(new StubSurface(el));
  var node = el.querySelector('#test1_content');
  var offset = 0;
  var coor = domSelection._getCoordinate(node, offset);
  assert.ok(coor, "Extracted coordinate should be !== null");
  assert.deepEqual(coor.path, ['test1', 'content'], 'Path should be extracted correctly.');
  assert.equal(coor.offset, 0, 'Offset should be extracted correctly.');
});

QUnit.uiTest("DOM coordinate on text property level (last)", function(assert) {
  var el = $('#qunit-fixture').html(textWithAnnotations)[0];
  var domSelection = new DOMSelection(new StubSurface(el));
  var node = el.querySelector('#test1_content');
  var offset = 4;
  var coor = domSelection._getCoordinate(node, offset);
  assert.ok(coor, "Extracted coordinate should be !== null");
  assert.deepEqual(coor.path, ['test1', 'content'], 'Path should be extracted correctly.');
  assert.equal(coor.offset, 8, 'Offset should be extracted correctly.');
});

var withAnnosAndInlines = [
  '<div id="test1">',
    '<span id="test1_content" data-path="test1.content">',
      '<span data-offset="0" data-length="2">..</span>',
      '<span data-inline="1">$</span>',
      '<span data-offset="3" data-length="2">..</span>',
      '<span data-inline="1">$</span>',
      '<span id="before-last" data-offset="6" data-length="2">..</span>',
      '<span data-inline="1">$</span>',
    '</span>',
  '</div>'
].join('');

QUnit.uiTest("DOM coordinate after last inline", function(assert) {
  var el = $('#qunit-fixture').html(withAnnosAndInlines)[0];
  var domSelection = new DOMSelection(new StubSurface(el));
  var node = el.querySelector('#test1_content');
  var offset = 6;
  var coor = domSelection._getCoordinate(node, offset);
  assert.ok(coor, "Extracted coordinate should be !== null");
  assert.deepEqual(coor.path, ['test1', 'content'], 'Path should be extracted correctly.');
  assert.equal(coor.offset, 9, 'Offset should be extracted correctly.');
});

QUnit.uiTest("DOM selection spanning over inline at end", function(assert) {
  var el = $('#qunit-fixture').html(withAnnosAndInlines)[0];
  var domSelection = new DOMSelection(new StubSurface(el));
  var anchorNode = el.querySelector('#before-last').childNodes[0];
  var anchorOffset = 2;
  var focusNode = el.querySelector('#test1_content');
  var focusOffset = 6;
  var range = domSelection._getRange(anchorNode, anchorOffset, focusNode, focusOffset);
  assert.ok(range, "Range should be !== null");
  assert.notOk(range.reverse, "Selection should be forward");
  assert.deepEqual(range.start.path, ['test1', 'content'], 'Path should be extracted correctly.');
  assert.deepEqual(range.start.offset, 8, 'startOffset should be extracted correctly.');
  assert.deepEqual(range.end.offset, 9, 'startOffset should be extracted correctly.');
});

var withoutHints = [
  '<div id="test1">',
    '<span id="test1_content" data-path="test1.content">',
      '<span>..</span>',
      '<span>..</span>',
      '<span>..</span>',
      '<span>..</span>',
    '</span>',
  '</div>'
].join('');

QUnit.uiTest("Without hints: DOM coordinate in first text node", function(assert) {
  var el = $('#qunit-fixture').html(withoutHints)[0];
  var domSelection = new DOMSelection(new StubSurface(el));
  var node = el.querySelector('#test1_content').children[0].firstChild;
  var offset = 1;
  var coor = domSelection._getCoordinate(node, offset);
  assert.ok(coor, "Extracted coordinate should be !== null");
  assert.equal(coor.offset, 1, 'Offset should be extracted correctly.');
});

QUnit.uiTest("Without hints: DOM coordinate in second text node", function(assert) {
  var el = $('#qunit-fixture').html(withoutHints)[0];
  var domSelection = new DOMSelection(new StubSurface(el));
  var node = el.querySelector('#test1_content').children[1].firstChild;
  var offset = 1;
  var coor = domSelection._getCoordinate(node, offset);
  assert.ok(coor, "Extracted coordinate should be !== null");
  assert.equal(coor.offset, 3, 'Offset should be extracted correctly.');
});

QUnit.uiTest("Without hints: DOM coordinate between spans", function(assert) {
  var el = $('#qunit-fixture').html(withoutHints)[0];
  var domSelection = new DOMSelection(new StubSurface(el));
  var node = el.querySelector('#test1_content');
  var offset = 2;
  var coor = domSelection._getCoordinate(node, offset);
  assert.ok(coor, "Extracted coordinate should be !== null");
  assert.equal(coor.offset, 4, 'Offset should be extracted correctly.');
});

// Test for issue #273

var issue273 = [
  '<span data-path="prop.content">',
    'XXX',
    '<span id="test" data-id="test" data-inline="1">',
      '[5]',
    '</span>',
    'XXX',
  '</span>'
].join('');

QUnit.uiTest("Issue #273: 'Could not find char position' when clicking right above an inline node", function(assert) {
  var el = $('#qunit-fixture').html(issue273)[0];
  var domSelection = new DOMSelection(new StubSurface(el));
  var node = el.querySelector('#test').childNodes[0];
  var offset = 0;
  var coor = domSelection._getCoordinate(node, offset);
  assert.ok(coor, "Extracted coordinate should be !== null");
  assert.equal(coor.offset, 3, 'Offset should be extracted correctly.');
  offset = 2;
  coor = domSelection._getCoordinate(node, offset);
  assert.ok(coor, "Extracted coordinate should be !== null");
  assert.equal(coor.offset, 4, 'Offset should be extracted correctly.');
});

var surfaceWithParagraphs = [
  '<div id="surface" class="surface">',
    '<p id="p1">',
      '<span data-path="p1.content">AA</span>',
    '</p>',
    '<p id="p2">',
      '<span data-path="p2.content">BBB</span>',
    '</p>',
    '<p id="p3">',
      '<span data-path="p3.content">CCCC</span>',
    '</p>',
  '</div>'
].join('');

QUnit.firefoxTest("Issue #354: Wrong selection in FF when double clicking between lines", function(assert) {
  var el = $('#qunit-fixture').html(surfaceWithParagraphs)[0];
  var domSelection = new DOMSelection(new StubSurface(el));
  var surface = el.querySelector('#surface');
  QUnit.setDOMSelection(surface, 0, surface, 1);
  var range = domSelection.mapDOMSelection();
  // assert.ok(sel.isPropertySelection(), "Selection should be property selection.");
  assert.deepEqual(range.start.path, ['p1', 'content'], 'Path should be extracted correctly.');
  assert.deepEqual([range.start.offset, range.end.offset], [0, 2], 'Offsets should be extracted correctly.');
});

QUnit.uiTest("Issue #376: Wrong selection mapping at end of paragraph", function(assert) {
  var el = $('#qunit-fixture').html(surfaceWithParagraphs)[0];
  var domSelection = new DOMSelection(new StubSurface(el));
  var p1span = el.querySelector('#p1 span');
  var p2 = el.querySelector('#p2');
  var range = domSelection._getRange(p1span, 1, p2, 0);
  assert.deepEqual(range.start.path, ['p1', 'content'], 'startPath');
  assert.deepEqual(range.start.offset, 2, 'startOffset');
  assert.deepEqual(range.end.path, ['p2', 'content'], 'endPath');
  assert.deepEqual(range.end.offset, 0, 'endOffset');
});

QUnit.uiTest("Mapping a ContainerSelection to the DOM", function(assert) {
  var el = $('#qunit-fixture').html(surfaceWithParagraphs)[0];
  var domSelection = new DOMSelection(new StubSurface(el));
  var sel = new ContainerSelection('main', ['p1', 'content'], 1, ['p2', 'content'], 1);
  domSelection.setSelection(sel);
  var p1span = el.querySelector('#p1 span');
  var p2span = el.querySelector('#p2 span');
  var p1Text = p1span.firstChild;
  var p2Text = p2span.firstChild;
  var wSel = window.getSelection();
  assert.equal(wSel.anchorNode, p1Text, 'anchorNode should be in first paragraph.');
  assert.equal(wSel.anchorOffset, 1, 'anchorOffset should be correct.');
  assert.equal(wSel.focusNode, p2Text, 'focusNode should be in second paragraph.');
  assert.equal(wSel.focusOffset, 1, 'focusOffset should be correct.');
});

QUnit.uiTest("Mapping a ContainerSelection from DOM to model", function(assert) {
  var el = $('#qunit-fixture').html(surfaceWithParagraphs)[0];
  var domSelection = new DOMSelection(new StubSurface(el, 'main'));
  var p1span = el.querySelector('#p1 span');
  var p2span = el.querySelector('#p2 span');
  var p1Text = p1span.firstChild;
  var p2Text = p2span.firstChild;
  QUnit.setDOMSelection(p1Text, 1, p2Text, 2);
  var sel = domSelection.getSelection(sel);
  assert.ok(sel.isContainerSelection(), 'Should be a container selection.');
  assert.deepEqual(sel.startPath, ['p1', 'content'], 'startPath should be correct.');
  assert.equal(sel.startOffset, 1, 'startOffset should be correct.');
  assert.deepEqual(sel.endPath, ['p2', 'content'], 'endPath should be correct.');
  assert.equal(sel.endOffset, 2, 'endOffset should be correct.');
});
