"use strict";

require('../qunit_extensions');

var isArray = require('lodash/lang/isArray');
var each = require('lodash/collection/each');
var simple = require('../../fixtures/simple');
var Clipboard = require('../../../ui/Clipboard');
var DOMElement = require('../../../ui/DOMElement');
var copySelection = require('../../../model/transform/copySelection');
var CLIPBOARD_CONTAINER_ID = copySelection.CLIPBOARD_CONTAINER_ID;
var CLIPBOARD_PROPERTY_ID = copySelection.CLIPBOARD_PROPERTY_ID;
var StubSurface = require('./StubSurface');

QUnit.uiModule('ui/Clipboard');

function ClipboardEventData() {
  this.data = {};

  this.getData = function(format) {
    return this.data[format];
  };

  this.setData = function(format, data) {
    this.data[format] = data;
  };
}

function ClipboardEvent() {
  this.clipboardData = new ClipboardEventData();
  this.preventDefault = function() {};
  this.stopPropagation = function() {};
}


// TODO: render a fixture
QUnit.uiTest("Copying a JSON, HTML, and plain text", function(assert) {
  var doc = simple();
  var surface = new StubSurface(doc, null, 'main');
  var clipboard = new Clipboard(surface, doc.getClipboardImporter(), doc.getClipboardExporter());
  var sel = doc.createSelection({ type: 'property', path: ['p1', 'content'], startOffset: 0, endOffset: 5 });
  surface.setSelection(sel);
  var event = new ClipboardEvent();
  clipboard.onCopy(event);

  var clipboardData = event.clipboardData;
  assert.isDefinedAndNotNull(clipboardData.data['application/substance'], "Clipboard should contain 'application/substance' data.");
  assert.isDefinedAndNotNull(clipboardData.data['text/plain'], "Clipboard should contain plain text data.");
  assert.isDefinedAndNotNull(clipboardData.data['text/html'], "Clipboard should contain HTML data.");

  var schema = doc.getSchema();
  var json = JSON.parse(clipboardData.data['application/substance']);
  assert.equal(json.schema.name, schema.name, 'JSON data should contain schema name.');
  assert.equal(json.schema.version, schema.version, 'JSON data should contain schema version.');
  assert.ok(isArray(json.nodes),'JSON data should contain array of nodes.');
});

QUnit.uiTest("Copying a property selection", function(assert) {
  var doc = simple();
  var schema = doc.getSchema();
  var surface = new StubSurface(doc, null, 'main');
  var clipboard = new Clipboard(surface, doc.getClipboardImporter(), doc.getClipboardExporter());
  var sel = doc.createSelection({ type: 'property', path: ['p1', 'content'], startOffset: 0, endOffset: 5 });
  surface.setSelection(sel);
  var TEXT = '01234';

  var event = new ClipboardEvent();
  clipboard.onCopy(event);

  var clipboardData = event.clipboardData;
  assert.equal(clipboardData.data['text/plain'], TEXT, "Plain text should be correct.");
  var el = DOMElement.parseHTML(clipboardData.data['text/html']);
  assert.ok(!isArray(el), "HTML should consist of one element.");
  // TODO: we should not export it as a <p> if it isn't a real paragraph
  assert.equal(el.nodeType, 'text', "HTML element should be a text node.");
  assert.equal(el.text(), TEXT, "HTML text should be correct.");

  var json = JSON.parse(clipboardData.data['application/substance']);
  var nodes = {};
  each(json.nodes, function(node) {
    nodes[node.id] = node;
  });
  assert.isDefinedAndNotNull(nodes[CLIPBOARD_CONTAINER_ID], 'JSON should contain the clipboard container node');
  assert.isDefinedAndNotNull(nodes[CLIPBOARD_PROPERTY_ID], 'JSON should contain the clipboard property node');
  assert.equal(nodes[CLIPBOARD_CONTAINER_ID].nodes.length, 1, "The clipboard container should contain one node.");
  assert.equal(nodes[CLIPBOARD_CONTAINER_ID].nodes[0], CLIPBOARD_PROPERTY_ID, "... which should be the property node.");
  assert.equal(nodes[CLIPBOARD_PROPERTY_ID].type, schema.getDefaultTextType(), "The property node should be a default text type.");
  assert.equal(nodes[CLIPBOARD_PROPERTY_ID].content, TEXT, "The property node should be a default text type.");
});
