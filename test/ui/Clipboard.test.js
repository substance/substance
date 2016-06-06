"use strict";

require('../QUnitExtensions');

var DocumentSession = require('../../model/DocumentSession');
var Registry = require('../../util/Registry');
var Clipboard = require('../../ui/Clipboard');
var DOMElement = require('../../ui/DOMElement');
var Component = require('../../ui/Component');
var StubSurface = require('./StubSurface');
var TestContainerEditor = require('./TestContainerEditor');

var fixture = require('../fixtures/createTestArticle');
var simple = require('../fixtures/simple');

var componentRegistry = new Registry({
  "paragraph": require('../../packages/paragraph/ParagraphComponent'),
  "heading": require('../../packages/heading/HeadingComponent'),
  "strong": require('../../ui/AnnotationComponent'),
  "emphasis": require('../../ui/AnnotationComponent'),
  "link": require('../../packages/link/LinkComponent'),
});

var converterRegistry = new Registry({
  "html": new Registry({
    "paragraph": require('../../packages/paragraph/ParagraphHTMLConverter'),
    "heading": require('../../packages/heading/HeadingHTMLConverter'),
    "strong": require('../../packages/strong/StrongHTMLConverter'),
    "emphasis": require('../../packages/emphasis/EmphasisHTMLConverter'),
    "link": require('../../packages/link/LinkHTMLConverter'),
  })
});

var clipboardConfig = {
  converterRegistry: converterRegistry
};

QUnit.uiModule('ui/Clipboard', {
  beforeEach: function() {
    Clipboard.NO_CATCH = QUnit.config.notrycatch;
  }
});

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

QUnit.uiTest("Copying HTML, and plain text", function(assert) {
  var doc = fixture(simple);
  var surface = new StubSurface(doc, null, 'body');
  var clipboard = new Clipboard(surface, clipboardConfig);
  var sel = doc.createSelection({ type: 'property', path: ['p1', 'content'], startOffset: 0, endOffset: 5 });
  surface.setSelection(sel);
  var event = new ClipboardEvent();
  clipboard.onCopy(event);

  var clipboardData = event.clipboardData;
  assert.isDefinedAndNotNull(clipboardData.data['text/plain'], "Clipboard should contain plain text data.");
  assert.isDefinedAndNotNull(clipboardData.data['text/html'], "Clipboard should contain HTML data.");

  var htmlDoc = DOMElement.parseHTML(clipboardData.data['text/html']);
  var body = htmlDoc.find('body');
  assert.isDefinedAndNotNull(body, 'The copied HTML should always be a full HTML document string, containing a body element.');
});

QUnit.uiTest("Copying a property selection", function(assert) {
  var doc = fixture(simple);
  var surface = new StubSurface(doc, null, 'body');
  var clipboard = new Clipboard(surface, clipboardConfig);
  var sel = doc.createSelection({ type: 'property', path: ['p1', 'content'], startOffset: 0, endOffset: 5 });
  surface.setSelection(sel);
  var TEXT = '01234';

  var event = new ClipboardEvent();
  clipboard.onCopy(event);

  var clipboardData = event.clipboardData;
  assert.equal(clipboardData.data['text/plain'], TEXT, "Plain text should be correct.");

  var htmlDoc = DOMElement.parseHTML(clipboardData.data['text/html']);
  var body = htmlDoc.find('body');
  var childNodes = body.getChildNodes();
  assert.equal(childNodes.length, 1, "There should be only one element");
  var el = childNodes[0];
  assert.equal(el.nodeType, 'text', "HTML element should be a text node.");
  assert.equal(el.text(), TEXT, "HTML text should be correct.");
});

QUnit.uiTest("Copying a container selection", function(assert) {
  var doc = fixture(simple);
  var surface = new StubSurface(doc, null, 'body');
  var clipboard = new Clipboard(surface, clipboardConfig);
  var sel = doc.createSelection({
    type: 'container',
    containerId: 'body',
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
  var elements = htmlDoc.find('body').getChildren();
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
  var doc = fixture(simple);
  var app = Component.mount(TestContainerEditor, {
    context: {
      documentSession: new DocumentSession(doc),
      componentRegistry: componentRegistry,
      converterRegistry: converterRegistry
    },
    node: doc.get('body')
  }, '#qunit-fixture');
  var editor = app.refs.editor;
  var sel = doc.createSelection({
    type: 'property',
    path: ['p1', 'content'],
    startOffset: 1
  });
  // editor.setFocused(true);
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

QUnit.uiTest("Pasting without any data given.", function(assert) {
  var editor = _containerEditorSample();
  var doc = editor.getDocument();
  var event = new ClipboardEvent();
  editor.clipboard.onPaste(event);
  assert.equal(doc.get(['p1', 'content']), '0123456789', "Text should be still the same.");
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

function _fixtureTest(assert, fixture, impl, forceWindows) {
  var editor = _containerEditorSample();
  if (forceWindows) {
    // NOTE: faking 'Windows' mode in importer so that
    // the correct implementation will be used
    editor.clipboard.htmlImporter._isWindows = true;
  }
  impl(editor, fixture);
}

function _plainTextTest(assert, fixture, forceWindows) {
  _fixtureTest(assert, fixture, function(editor, html) {
    var doc = editor.getDocument();
    var event = new ClipboardEvent();
    event.clipboardData.setData('text/plain', '');
    event.clipboardData.setData('text/html', html);
    editor.clipboard.onPaste(event);
    assert.equal(doc.get(['p1', 'content']), '0XXX123456789', "Content should have been pasted correctly.");
  }, forceWindows);
}

function _annotatedTextTest(assert, fixture, forceWindows) {
  _fixtureTest(assert, fixture, function(editor, html) {
    var doc = editor.getDocument();
    var event = new ClipboardEvent();
    event.clipboardData.setData('text/plain', '');
    event.clipboardData.setData('text/html', html);
    editor.clipboard.onPaste(event);
    assert.equal(doc.get(['p1', 'content']), '0XXX123456789', "Content should have been pasted correctly.");
    var annotations = doc.getIndex('annotations').get(['p1', 'content']);
    assert.equal(annotations.length, 1, "There should be one annotation on the property now.");
    var anno = annotations[0];
    assert.equal(anno.type, 'link', "The annotation should be a link.");
  }, forceWindows);
}

function _twoParagraphsTest(assert, fixture, forceWindows) {
  _fixtureTest(assert, fixture, function(editor, html) {
    var doc = editor.getDocument();
    var event = new ClipboardEvent();
    event.clipboardData.setData('text/plain', '');
    event.clipboardData.setData('text/html', html);
    editor.clipboard.onPaste(event);
    var body = doc.get('body');
    var p1 = body.getChildAt(0);
    assert.equal(p1.content, '0AAA', "First paragraph should be truncated.");
    var p2 = body.getChildAt(1);
    assert.equal(p2.content, 'BBB', "Second paragraph should contain 'BBB'.");
    var p3 = body.getChildAt(2);
    assert.equal(p3.content, '123456789', "Remainder of original p1 should go into forth paragraph.");
  }, forceWindows);
}

QUnit.uiTest("Browser - Chrome (OSX/Linux) - Plain Text", function(assert) {
  _plainTextTest(assert, require('../fixtures/html/browser-linux-plain-text'));
});

QUnit.uiTest("Browser - Chrome (OSX/Linux) - Annotated Text", function(assert) {
  _annotatedTextTest(assert, require('../fixtures/html/browser-linux-annotated-text'));
});

QUnit.uiTest("Browser - Chrome (OSX/Linux) - Two Paragraphs", function(assert) {
  _twoParagraphsTest(assert, require('../fixtures/html/browser-linux-two-paragraphs'));
});

QUnit.uiTest("Browser - Chrome (Windows) - Plain Text", function(assert) {
  _plainTextTest(assert, require('../fixtures/html/browser-windows-plain-text'), 'forceWindows');
});

QUnit.uiTest("Browser - Chrome (Windows) - Annotated Text", function(assert) {
  _annotatedTextTest(assert, require('../fixtures/html/browser-windows-annotated-text'), 'forceWindows');
});

QUnit.uiTest("Browser - Chrome (Windows) - Two Paragraphs", function(assert) {
  _twoParagraphsTest(assert, require('../fixtures/html/browser-windows-two-paragraphs'), 'forceWindows');
});

QUnit.uiTest("Browser - Firefox (Linux) - Plain Text", function(assert) {
  _plainTextTest(assert, require('../fixtures/html/browser-linux-firefox-plain-text'));
});

QUnit.uiTest("Browser - Firefox (Linux) - Annotated Text", function(assert) {
  _annotatedTextTest(assert, require('../fixtures/html/browser-linux-firefox-annotated-text'));
});

QUnit.uiTest("Browser - Firefox (Linux) - Two Paragraphs", function(assert) {
  _twoParagraphsTest(assert, require('../fixtures/html/browser-linux-firefox-two-paragraphs'));
});

QUnit.uiTest("Browser - Firefox (Linux) - Whole Page", function(assert) {
  _fixtureTest(assert, require('../fixtures/html/browser-linux-firefox-whole-page'), function(editor, html) {
    var doc = editor.getDocument();
    var event = new ClipboardEvent();
    event.clipboardData.setData('text/plain', 'XXX');
    event.clipboardData.setData('text/html', html);
    editor.clipboard.onPaste(event);
    assert.equal(doc.get(['p1', 'content']), '0XXX123456789', "Content should have been pasted correctly.");
  });
});

QUnit.uiTest("Browser - Firefox (OSX) - Plain Text", function(assert) {
  _plainTextTest(assert, require('../fixtures/html/browser-osx-firefox-plain-text'));
});

QUnit.uiTest("Browser - Firefox (OSX) - Annotated Text", function(assert) {
  _annotatedTextTest(assert, require('../fixtures/html/browser-osx-firefox-annotated-text'));
});

QUnit.uiTest("Browser - Firefox (OSX) - Two Paragraphs", function(assert) {
  _twoParagraphsTest(assert, require('../fixtures/html/browser-osx-firefox-two-paragraphs'));
});

QUnit.uiTest("Browser - Firefox (Windows) - Plain Text", function(assert) {
  _plainTextTest(assert, require('../fixtures/html/browser-windows-firefox-plain-text'), 'forceWindows');
});

QUnit.uiTest("Browser - Firefox (Windows) - Annotated Text", function(assert) {
  _annotatedTextTest(assert, require('../fixtures/html/browser-windows-firefox-annotated-text'), 'forceWindows');
});

QUnit.uiTest("Browser - Firefox (Windows) - Two Paragraphs", function(assert) {
  _twoParagraphsTest(assert, require('../fixtures/html/browser-windows-firefox-two-paragraphs'), 'forceWindows');
});

QUnit.uiTest("Browser - Edge (Windows) - Plain Text", function(assert) {
  _plainTextTest(assert, require('../fixtures/html/browser-windows-edge-plain-text'), 'forceWindows');
});

QUnit.uiTest("Browser - Edge (Windows) - Annotated Text", function(assert) {
  _annotatedTextTest(assert, require('../fixtures/html/browser-windows-edge-annotated-text'), 'forceWindows');
});

QUnit.uiTest("Browser - Edge (Windows) - Two Paragraphs", function(assert) {
  _twoParagraphsTest(assert, require('../fixtures/html/browser-windows-edge-two-paragraphs'), 'forceWindows');
});

QUnit.uiTest("GoogleDocs - Chrome (OSX/Linux) - Plain Text", function(assert) {
  _plainTextTest(assert, require('../fixtures/html/google-docs-osx-linux-chrome-plain-text'));
});

QUnit.uiTest("GoogleDocs - Chrome (OSX/Linux) - Annotated Text", function(assert) {
  _annotatedTextTest(assert, require('../fixtures/html/google-docs-osx-linux-chrome-annotated-text'));
});

QUnit.uiTest("GoogleDocs - Chrome (OSX/Linux) - Two Paragraphs", function(assert) {
  _twoParagraphsTest(assert, require('../fixtures/html/google-docs-osx-linux-chrome-two-paragraphs'));
});

QUnit.uiTest("GoogleDocs - Firefox (Linux) - Plain Text", function(assert) {
  _plainTextTest(assert, require('../fixtures/html/google-docs-linux-firefox-plain-text'));
});

QUnit.uiTest("GoogleDocs - Firefox (Linux) - Annotated Text", function(assert) {
  _annotatedTextTest(assert, require('../fixtures/html/google-docs-linux-firefox-annotated-text'));
});

QUnit.uiTest("GoogleDocs - Firefox (OSX) - Plain Text", function(assert) {
  _plainTextTest(assert, require('../fixtures/html/google-docs-osx-firefox-plain-text'));
});

QUnit.uiTest("LibreOffice (OSX/Linux) - Plain Text", function(assert) {
  _plainTextTest(assert, require('../fixtures/html/libre-office-osx-linux-plain-text'));
});

QUnit.uiTest("LibreOffice (OSX/Linux) - Annotated Text", function(assert) {
  _annotatedTextTest(assert, require('../fixtures/html/libre-office-osx-linux-annotated-text'));
});

QUnit.uiTest("LibreOffice (OSX/Linux) - Two Paragraphs", function(assert) {
  _twoParagraphsTest(assert, require('../fixtures/html/libre-office-osx-linux-two-paragraphs'));
});

QUnit.uiTest("Microsoft Word 11 (OSX) - Plain Text", function(assert) {
  _plainTextTest(assert, require('../fixtures/html/word-11-osx-plain-text'));
});

QUnit.uiTest("Microsoft Word 11 (OSX) - Annotated Text", function(assert) {
  _annotatedTextTest(assert, require('../fixtures/html/word-11-osx-annotated-text'));
});

QUnit.uiTest("Microsoft Word 11 (OSX) - Two Paragraphs", function(assert) {
  _twoParagraphsTest(assert, require('../fixtures/html/word-11-osx-two-paragraphs'));
});
