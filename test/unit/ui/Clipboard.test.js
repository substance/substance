"use strict";

require('../qunit_extensions');

var isArray = require('lodash/lang/isArray');
var each = require('lodash/collection/each');
var simple = require('../../fixtures/simple');
var Clipboard = require('../../../ui/Clipboard');
var DOMElement = require('../../../ui/DOMElement');
var VirtualDOMElement = require('../../../ui/VirtualDOMElement');
var Component = require('../../../ui/Component');
var copySelection = require('../../../model/transform/copySelection');
var CLIPBOARD_CONTAINER_ID = copySelection.CLIPBOARD_CONTAINER_ID;
var CLIPBOARD_PROPERTY_ID = copySelection.CLIPBOARD_PROPERTY_ID;
var StubSurface = require('./StubSurface');
var $ = require('../../../util/jquery');
var $$ = VirtualDOMElement.createElement;
var load = require('../load');

var TestContainerEditor = require('./TestContainerEditor');
var components = {
  "paragraph": require('../../../packages/paragraph/ParagraphComponent')
};

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

Object.defineProperty(ClipboardEventData.prototype, 'types', {
  get: function() {
    return Object.keys(this.data);
  }
});

function ClipboardEvent() {
  this.clipboardData = new ClipboardEventData();
  this.preventDefault = function() {};
  this.stopPropagation = function() {};
}


// TODO: render a fixture
QUnit.uiTest("Copying a JSON, HTML, and plain text", function(assert) {
  var doc = simple();
  var surface = new StubSurface(doc, null, 'main');
  var clipboard = new Clipboard(surface);
  var sel = doc.createSelection({ type: 'property', path: ['p1', 'content'], startOffset: 0, endOffset: 5 });
  surface.setSelection(sel);
  var event = new ClipboardEvent();
  clipboard.onCopy(event);

  var clipboardData = event.clipboardData;
  assert.isDefinedAndNotNull(clipboardData.data['application/substance'], "Clipboard should contain 'application/substance' data.");
  assert.isDefinedAndNotNull(clipboardData.data['text/plain'], "Clipboard should contain plain text data.");
  assert.isDefinedAndNotNull(clipboardData.data['text/html'], "Clipboard should contain HTML data.");

  var htmlDoc = DOMElement.parseHTML(clipboardData.data['text/html']);
  var body = htmlDoc.find('body');
  assert.isDefinedAndNotNull(body, 'The copied HTML should always be a full HTML document string, containing a body element.');

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
  var clipboard = new Clipboard(surface);
  var sel = doc.createSelection({ type: 'property', path: ['p1', 'content'], startOffset: 0, endOffset: 5 });
  surface.setSelection(sel);
  var TEXT = '01234';

  var event = new ClipboardEvent();
  clipboard.onCopy(event);

  var clipboardData = event.clipboardData;
  assert.equal(clipboardData.data['text/plain'], TEXT, "Plain text should be correct.");

  var htmlDoc = DOMElement.parseHTML(clipboardData.data['text/html']);
  var body = htmlDoc.find('body');
  var childNodes = body.childNodes;
  assert.equal(childNodes.length, 1, "There should be only one element");
  var el = childNodes[0];
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

QUnit.uiTest("Copying a container selection", function(assert) {
  var doc = simple();
  var surface = new StubSurface(doc, null, 'main');
  var clipboard = new Clipboard(surface);
  var sel = doc.createSelection({
    type: 'container',
    containerId: 'main',
    startPath: ['p1', 'content'],
    startOffset: 1,
    endPath: ['p3', 'content'],
    endOffset: 5
  });
  surface.setSelection(sel);
  var TEXT = [
    '123456789',
    '0123456789',
    '01234'
  ];

  var event = new ClipboardEvent();
  clipboard.onCopy(event);

  var clipboardData = event.clipboardData;
  assert.equal(clipboardData.data['text/plain'], TEXT.join('\n'), "Plain text should be correct.");

  var htmlDoc = DOMElement.parseHTML(clipboardData.data['text/html']);
  var elements = htmlDoc.find('body').children;
  assert.equal(elements.length, 3, "HTML should consist of three elements.");
  var p1 = elements[0];
  assert.equal(p1.attr('data-id'), 'p1', "First element should have correct data-id.");
  assert.equal(p1.text(), TEXT[0], "First element should have correct text content.");
  var p2 = elements[1];
  assert.equal(p2.attr('data-id'), 'p2', "Second element should have correct data-id.");
  assert.equal(p2.text(), TEXT[1], "Second element should have correct text content.");
  var p3 = elements[2];
  assert.equal(p3.attr('data-id'), 'p3', "Third element should have correct data-id.");
  assert.equal(p3.text(), TEXT[2], "Third element should have correct text content.");
});

function _containerEditorSample() {
  var doc = simple();
  var app = Component.mount($$(TestContainerEditor, {
    doc: doc,
    config: {
      controller: {
        components: components,
        commands: [],
      }
    }
  }), $('#qunit-fixture'));
  var editor = app.refs.editor;
  var sel = doc.createSelection({
    type: 'property',
    path: ['p1', 'content'],
    startOffset: 1
  });
  editor.setFocused(true);
  // HACK faking that the element is focused natively
  editor.isNativeFocused = true;
  editor.setSelection(sel);

  return editor;
}

QUnit.uiTest("Pasting text into ContainerEditor using 'text/plain'.", function(assert) {
  var editor = _containerEditorSample();
  var doc = editor.getDocument();
  var event = new ClipboardEvent();
  event.clipboardData.setData('text/plain', 'XXX');
  editor.clipboard.onPaste(event);
  assert.equal(doc.get(['p1', 'content']), '0XXX123456789', "Plain text should be correct.");
});

QUnit.uiTest("Pasting text into ContainerEditor using 'text/html'.", function(assert) {
  var editor = _containerEditorSample();
  var doc = editor.getDocument();
  var TEXT = 'XXX';
  var event = new ClipboardEvent();
  event.clipboardData.setData('text/plain', TEXT);
  event.clipboardData.setData('text/html', TEXT);
  editor.clipboard.onPaste(event);
  assert.equal(doc.get(['p1', 'content']), '0XXX123456789', "Plain text should be correct.");
});

QUnit.uiTest("Pasting text into ContainerEditor using json.", function(assert) {
  var editor = _containerEditorSample();
  var doc = editor.getDocument();
  var schema = doc.getSchema();

  var TEXT = 'XXX';
  var json = {
    schema: {
      name: schema.name,
      version: schema.version
    },
    nodes: [
      { type: 'paragraph',  id: CLIPBOARD_PROPERTY_ID, content: TEXT},
      { type: 'container', id: CLIPBOARD_CONTAINER_ID, nodes: [CLIPBOARD_PROPERTY_ID] }
    ]
  };
  var event = new ClipboardEvent();
  // Note: intentionally setting a different plain-text data
  // to make sure that pasting has been done via json
  event.clipboardData.setData('text/plain', 'ZZZ');
  event.clipboardData.setData('application/substance', JSON.stringify(json));
  editor.clipboard.onPaste(event);
  assert.equal(doc.get(['p1', 'content']), '0XXX123456789', "Text should be have been inserted correctly.");
});

QUnit.uiTest("Pasting using json with wrong schema.", function(assert) {
  var editor = _containerEditorSample();
  var doc = editor.getDocument();
  var json = {
    schema: { name: 'WRONG SCHEMA', version: '1.0.0' },
    nodes: []
  };
  var event = new ClipboardEvent();
  event.clipboardData.setData('text/plain', 'XXX');
  event.clipboardData.setData('application/substance', JSON.stringify(json));

  editor.clipboard.onPaste(event);
  assert.equal(doc.get(['p1', 'content']), '0XXX123456789', "Pasting should have fallen back to plain-text pasting.");
});

function _with(assert, fixture, fn) {
  var done = assert.async();
  load(fixture)
    .then(function(html) {
      fn(html);
      done();
    })
    .catch(function(err) {
      if (err === 404) {
        assert.fail("Couldn't load fixture '" + fixture + "'");
      } else {
        assert.fail(err.stack);
      }
      done();
    });
}

QUnit.uiTest("Browser - Chrome (OSX/Linux) - Plain Text", function(assert) {
  var editor = _containerEditorSample();
  var doc = editor.getDocument();
  _with(assert, '/base/test/fixtures/clipboard/browser-linux-plain-text.html', function(html) {
    var event = new ClipboardEvent();
    event.clipboardData.setData('text/plain', '');
    event.clipboardData.setData('text/html', html);
    editor.clipboard.onPaste(event);
    assert.equal(doc.get(['p1', 'content']), '0XXX123456789', "Content should have been pasted.");
  });
});

QUnit.uiTest("Browser - Chrome (OSX/Linux) - Annotated Text", function(assert) {
  var editor = _containerEditorSample();
  var doc = editor.getDocument();
  _with(assert, '/base/test/fixtures/clipboard/browser-linux-annotated-text.html', function(html) {
    var event = new ClipboardEvent();
    event.clipboardData.setData('text/plain', '');
    event.clipboardData.setData('text/html', html);
    editor.clipboard.onPaste(event);
    assert.equal(doc.get(['p1', 'content']), '0XXX123456789', "Content should have been pasted.");
    var annotations = doc.getIndex('annotations').get(['p1', 'content']);
    assert.equal(annotations.length, 1, "There should be one annotation on the property now.");
    var anno = annotations[0];
    assert.equal(anno.type, 'link', "The annotation should be a link.");
  })
});
