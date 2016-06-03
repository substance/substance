"use strict";

require('../qunit_extensions');

var error = require('../../../util/error');
var simple = require('../../fixtures/simple');
var Clipboard = require('../../../ui/Clipboard');
var DOMElement = require('../../../ui/DOMElement');
var Component = require('../../../ui/Component');
var StubSurface = require('./StubSurface');
var DocumentSession = require('../../../model/DocumentSession');
var load = require('../load');

var TestContainerEditor = require('./TestContainerEditor');
var components = {
  "paragraph": require('../../../packages/paragraph/ParagraphComponent')
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
  var doc = simple();
  var surface = new StubSurface(doc, null, 'main');
  var clipboard = new Clipboard(surface);
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
  var doc = simple();
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
  var childNodes = body.getChildNodes();
  assert.equal(childNodes.length, 1, "There should be only one element");
  var el = childNodes[0];
  assert.equal(el.nodeType, 'text', "HTML element should be a text node.");
  assert.equal(el.text(), TEXT, "HTML text should be correct.");
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
  var doc = simple();
  var documentSession = new DocumentSession(doc);
  var app = Component.mount(TestContainerEditor, {
    doc: doc,
    documentSession: documentSession,
    config: {
      controller: {
        components: components,
        commands: [],
      }
    }
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

function _with(assert, fixture, fn) {
  var done = assert.async();
  var p = load(fixture)
    .then(function(html) {
      fn(html);
    })
    .then(done);
  if (!QUnit.config.notrycatch) {
    p.catch(function(err) {
      error(err.stack);
      done();
    });
  }
}

function _fixtureTest(assert, fixture, impl, forceWindows) {
  var editor = _containerEditorSample();
  fixture = '/base/test/fixtures/clipboard/' + fixture;
  if (forceWindows) {
    // NOTE: faking 'Windows' mode in importer so that
    // the correct implementation will be used
    editor.clipboard.htmlImporter._isWindows = true;
  }
  _with(assert, fixture, function(html) {
    impl(editor, html);
  });
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
    var main = doc.get('main');
    var p1 = main.getChildAt(0);
    assert.equal(p1.content, '0AAA', "First paragraph should be truncated.");
    var p2 = main.getChildAt(1);
    assert.equal(p2.content, 'BBB', "Second paragraph should contain 'BBB'.");
    var p3 = main.getChildAt(2);
    assert.equal(p3.content, '123456789', "Remainder of original p1 should go into forth paragraph.");
  }, forceWindows);
}

QUnit.uiTest("Browser - Chrome (OSX/Linux) - Plain Text", function(assert) {
  _plainTextTest(assert, 'browser-linux-plain-text.html');
});

QUnit.uiTest("Browser - Chrome (OSX/Linux) - Annotated Text", function(assert) {
  _annotatedTextTest(assert, 'browser-linux-annotated-text.html');
});

QUnit.uiTest("Browser - Chrome (OSX/Linux) - Two Paragraphs", function(assert) {
  _twoParagraphsTest(assert, 'browser-linux-two-paragraphs.html');
});

QUnit.uiTest("Browser - Chrome (Windows) - Plain Text", function(assert) {
  _plainTextTest(assert, 'browser-windows-plain-text.html', 'forceWindows');
});

QUnit.uiTest("Browser - Chrome (Windows) - Annotated Text", function(assert) {
  _annotatedTextTest(assert, 'browser-windows-annotated-text.html', 'forceWindows');
});

QUnit.uiTest("Browser - Chrome (Windows) - Two Paragraphs", function(assert) {
  _twoParagraphsTest(assert, 'browser-windows-two-paragraphs.html', 'forceWindows');
});

QUnit.uiTest("Browser - Firefox (Linux) - Plain Text", function(assert) {
  _plainTextTest(assert, 'browser-linux-firefox-plain-text.html');
});

QUnit.uiTest("Browser - Firefox (Linux) - Annotated Text", function(assert) {
  _annotatedTextTest(assert, 'browser-linux-firefox-annotated-text.html');
});

QUnit.uiTest("Browser - Firefox (Linux) - Two Paragraphs", function(assert) {
  _twoParagraphsTest(assert, 'browser-linux-firefox-two-paragraphs.html');
});

QUnit.uiTest("Browser - Firefox (Linux) - Whole Page", function(assert) {
  _fixtureTest(assert, 'browser-linux-firefox-whole-page.html', function(editor, html) {
    var doc = editor.getDocument();
    var event = new ClipboardEvent();
    event.clipboardData.setData('text/plain', 'XXX');
    event.clipboardData.setData('text/html', html);
    editor.clipboard.onPaste(event);
    // in most cases HTML conversion will crash
    // and Clipboard should fall back to plain text
    assert.equal(doc.get(['p1', 'content']), '0XXX123456789', "Content should have been pasted correctly.");
  });
});

QUnit.uiTest("Browser - Firefox (OSX) - Plain Text", function(assert) {
  _plainTextTest(assert, 'browser-osx-firefox-plain-text.html');
});

QUnit.uiTest("Browser - Firefox (OSX) - Annotated Text", function(assert) {
  _annotatedTextTest(assert, 'browser-osx-firefox-annotated-text.html');
});

QUnit.uiTest("Browser - Firefox (OSX) - Two Paragraphs", function(assert) {
  _twoParagraphsTest(assert, 'browser-osx-firefox-two-paragraphs.html');
});

QUnit.uiTest("Browser - Firefox (Windows) - Plain Text", function(assert) {
  _plainTextTest(assert, 'browser-windows-firefox-plain-text.html', 'forceWindows');
});

QUnit.uiTest("Browser - Firefox (Windows) - Annotated Text", function(assert) {
  _annotatedTextTest(assert, 'browser-windows-firefox-annotated-text.html', 'forceWindows');
});

QUnit.uiTest("Browser - Firefox (Windows) - Two Paragraphs", function(assert) {
  _twoParagraphsTest(assert, 'browser-windows-firefox-two-paragraphs.html', 'forceWindows');
});

QUnit.uiTest("Browser - Edge (Windows) - Plain Text", function(assert) {
  _plainTextTest(assert, 'browser-windows-edge-plain-text.html', 'forceWindows');
});

QUnit.uiTest("Browser - Edge (Windows) - Annotated Text", function(assert) {
  _annotatedTextTest(assert, 'browser-windows-edge-annotated-text.html', 'forceWindows');
});

QUnit.uiTest("Browser - Edge (Windows) - Two Paragraphs", function(assert) {
  _twoParagraphsTest(assert, 'browser-windows-edge-two-paragraphs.html', 'forceWindows');
});

QUnit.uiTest("GoogleDocs - Chrome (OSX/Linux) - Plain Text", function(assert) {
  _plainTextTest(assert, 'google-docs-osx-linux-chrome-plain-text.html');
});

QUnit.uiTest("GoogleDocs - Chrome (OSX/Linux) - Annotated Text", function(assert) {
  _annotatedTextTest(assert, 'google-docs-osx-linux-chrome-annotated-text.html');
});

QUnit.uiTest("GoogleDocs - Chrome (OSX/Linux) - Two Paragraphs", function(assert) {
  _twoParagraphsTest(assert, 'google-docs-osx-linux-chrome-two-paragraphs.html');
});

QUnit.uiTest("GoogleDocs - Firefox (Linux) - Plain Text", function(assert) {
  _plainTextTest(assert, 'google-docs-linux-firefox-plain-text.html');
});

QUnit.uiTest("GoogleDocs - Firefox (Linux) - Annotated Text", function(assert) {
  _annotatedTextTest(assert, 'google-docs-linux-firefox-annotated-text.html');
});

QUnit.uiTest("GoogleDocs - Firefox (OSX) - Plain Text", function(assert) {
  _plainTextTest(assert, 'google-docs-osx-firefox-plain-text.html');
});

QUnit.uiTest("LibreOffice (OSX/Linux) - Plain Text", function(assert) {
  _plainTextTest(assert, 'libre-office-osx-linux-plain-text.html');
});

QUnit.uiTest("LibreOffice (OSX/Linux) - Annotated Text", function(assert) {
  _annotatedTextTest(assert, 'libre-office-osx-linux-annotated-text.html');
});

QUnit.uiTest("LibreOffice (OSX/Linux) - Two Paragraphs", function(assert) {
  _twoParagraphsTest(assert, 'libre-office-osx-linux-two-paragraphs.html');
});

QUnit.uiTest("Microsoft Word 11 (OSX) - Plain Text", function(assert) {
  _plainTextTest(assert, 'word-11-osx-plain-text.html');
});

QUnit.uiTest("Microsoft Word 11 (OSX) - Annotated Text", function(assert) {
  _annotatedTextTest(assert, 'word-11-osx-annotated-text.html');
});

QUnit.uiTest("Microsoft Word 11 (OSX) - Two Paragraphs", function(assert) {
  _twoParagraphsTest(assert, 'word-11-osx-two-paragraphs.html');
});
