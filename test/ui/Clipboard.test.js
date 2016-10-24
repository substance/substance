import { module } from 'substance-test'

import DocumentSession from '../../model/DocumentSession'
import Registry from '../../util/Registry'
import ComponentRegistry from '../../ui/ComponentRegistry'
import Clipboard from '../../ui/Clipboard'
import DefaultDOMElement from '../../ui/DefaultDOMElement'
import StubSurface from './StubSurface'
import TestContainerEditor from './TestContainerEditor'

import fixture from '../fixtures/createTestArticle'
import simple from '../fixtures/simple'

import ParagraphComponent from '../../packages/paragraph/ParagraphComponent'
import HeadingComponent from '../../packages/heading/HeadingComponent'
import AnnotationComponent from '../../ui/AnnotationComponent'
import LinkComponent from '../../packages/link/LinkComponent'
import CodeblockComponent from '../../packages/codeblock/CodeblockComponent'
import ParagraphHTMLConverter from '../../packages/paragraph/ParagraphHTMLConverter'
import HeadingHTMLConverter from '../../packages/heading/HeadingHTMLConverter'
import StrongHTMLConverter from '../../packages/strong/StrongHTMLConverter'
import EmphasisHTMLConverter from '../../packages/emphasis/EmphasisHTMLConverter'
import LinkHTMLConverter from '../../packages/link/LinkHTMLConverter'
import CodeblockHTMLConverter from '../../packages/codeblock/CodeblockHTMLConverter'

import BrowserLinuxPLainTextFixture from '../fixtures/html/browser-linux-plain-text'
import BrowserLinuxAnnotatedTextFixture from '../fixtures/html/browser-linux-annotated-text'
import BrowserLinuxTwoParagraphsFixture from '../fixtures/html/browser-linux-two-paragraphs'
import BrowserWindowsPlainTextFixture from '../fixtures/html/browser-windows-plain-text'
import BrowserWindowsAnnotatedTextFixture from '../fixtures/html/browser-windows-annotated-text'
import BrowserWindowsTwoParagraphsFixture from '../fixtures/html/browser-windows-two-paragraphs'
import BrowserLinuxFirefoxPlainTextFixture from '../fixtures/html/browser-linux-firefox-plain-text'
import BrowserLinuxFirefoxAnnotatedTextFixture from '../fixtures/html/browser-linux-firefox-annotated-text'
import BrowserLinuxFirefoxTwoParagraphsFixture from '../fixtures/html/browser-linux-firefox-two-paragraphs'
import BrowserLinuxFirefoxWholePageFixture from '../fixtures/html/browser-linux-firefox-whole-page'
import BrowserOSXFirefoxPlainTextFixture from '../fixtures/html/browser-osx-firefox-plain-text'
import BrowserOSXFirefoxAnnotatedTextFixture from '../fixtures/html/browser-osx-firefox-annotated-text'
import BrowserOSXFirefoxTwoParagraphsFixture from '../fixtures/html/browser-osx-firefox-two-paragraphs'
import BrowserWindowsFirefoxPlainTextFixture from '../fixtures/html/browser-windows-firefox-plain-text'
import BrowserWindowsFirefoxAnnotatedTextFixture from '../fixtures/html/browser-windows-firefox-annotated-text'
import BrowserWindowsFirefoxTwoParagraphsFixture from '../fixtures/html/browser-windows-firefox-two-paragraphs'
import BrowserWindowsEdgePlainTextFixture from '../fixtures/html/browser-windows-edge-plain-text'
import BrowserWindowsEdgeAnnotatedTextFixture from '../fixtures/html/browser-windows-edge-annotated-text'
import BrowserWindowsEdgeTwoParagraphsFixture from '../fixtures/html/browser-windows-edge-two-paragraphs'
import GDocsOSXLinuxChromePlainTextFixture from '../fixtures/html/google-docs-osx-linux-chrome-plain-text'
import GDocsOSXLinuxChromeAnnotatedTextFixture from '../fixtures/html/google-docs-osx-linux-chrome-annotated-text'
import GDocsOSXLinuxChromeTwoParagraphsFixture from '../fixtures/html/google-docs-osx-linux-chrome-two-paragraphs'
import GDocsLinuxFirefoxPlainTextFixture from '../fixtures/html/google-docs-linux-firefox-plain-text'
import GDocsLinuxFirefoxAnnotatedTextFixture from '../fixtures/html/google-docs-linux-firefox-annotated-text'
import GDocsOSXFirefoxPlainTextFixture from '../fixtures/html/google-docs-osx-firefox-plain-text'
import LibreOfficeOSXPlainTextFixture from '../fixtures/html/libre-office-osx-linux-plain-text'
import LibreOfficeOSXAnnotatedTextFixture from '../fixtures/html/libre-office-osx-linux-annotated-text'
import LibreOfficeOSXTwoParagraphsFixture from '../fixtures/html/libre-office-osx-linux-two-paragraphs'
import MSW11OSXPlainTextFixture from '../fixtures/html/word-11-osx-plain-text'
import MSW11OSXAnnotatedTextFixture from '../fixtures/html/word-11-osx-annotated-text'
import MSW11OSXTwoParagraphsFixture from '../fixtures/html/word-11-osx-two-paragraphs'

const test = module('ui/Clipboard')

var componentRegistry = new ComponentRegistry({
  "paragraph": ParagraphComponent,
  "heading": HeadingComponent,
  "strong": AnnotationComponent,
  "emphasis": AnnotationComponent,
  "link": LinkComponent,
  "codeblock": CodeblockComponent,
})

var converterRegistry = new Registry({
  "html": new Registry({
    "paragraph": ParagraphHTMLConverter,
    "heading": HeadingHTMLConverter,
    "strong": StrongHTMLConverter,
    "emphasis": EmphasisHTMLConverter,
    "link": LinkHTMLConverter,
    "codeblock": CodeblockHTMLConverter,
  })
})

var clipboardConfig = {
  converterRegistry: converterRegistry
}

function ClipboardEventData() {
  this.data = {}

  this.getData = function(format) {
    return this.data[format]
  }

  this.setData = function(format, data) {
    this.data[format] = data
  }
}

Object.defineProperty(ClipboardEventData.prototype, 'types', {
  get: function() {
    return Object.keys(this.data)
  }
})

function ClipboardEvent() {
  this.clipboardData = new ClipboardEventData()
  this.preventDefault = function() {}
  this.stopPropagation = function() {}
}

test.UI("Copying HTML, and plain text", function(t) {
  var doc = fixture(simple)
  var surface = new StubSurface(doc, null, 'body')
  var clipboard = new Clipboard(surface, clipboardConfig)
  var sel = doc.createSelection({ type: 'property', path: ['p1', 'content'], startOffset: 0, endOffset: 5 })
  surface.setSelection(sel)
  var event = new ClipboardEvent()
  clipboard.onCopy(event)

  var clipboardData = event.clipboardData
  t.notNil(clipboardData.data['text/plain'], "Clipboard should contain plain text data.")
  t.notNil(clipboardData.data['text/html'], "Clipboard should contain HTML data.")

  var htmlDoc = DefaultDOMElement.parseHTML(clipboardData.data['text/html'])
  var body = htmlDoc.find('body')
  t.notNil(body, 'The copied HTML should always be a full HTML document string, containing a body element.')
  t.end()
})

test.UI("Copying a property selection", function(t) {
  var doc = fixture(simple)
  var surface = new StubSurface(doc, null, 'body')
  var clipboard = new Clipboard(surface, clipboardConfig)
  var sel = doc.createSelection({ type: 'property', path: ['p1', 'content'], startOffset: 0, endOffset: 5 })
  surface.setSelection(sel)
  var TEXT = '01234'

  var event = new ClipboardEvent()
  clipboard.onCopy(event)

  var clipboardData = event.clipboardData
  t.equal(clipboardData.data['text/plain'], TEXT, "Plain text should be correct.")

  var htmlDoc = DefaultDOMElement.parseHTML(clipboardData.data['text/html'])
  var body = htmlDoc.find('body')
  var childNodes = body.getChildNodes()
  t.equal(childNodes.length, 1, "There should be only one element")
  var el = childNodes[0]
  t.equal(el.nodeType, 'text', "HTML element should be a text node.")
  t.equal(el.text(), TEXT, "HTML text should be correct.")
  t.end()
})

test.UI("Copying a container selection", function(t) {
  var doc = fixture(simple)
  var surface = new StubSurface(doc, null, 'body')
  var clipboard = new Clipboard(surface, clipboardConfig)
  var sel = doc.createSelection({
    type: 'container',
    containerId: 'body',
    startPath: ['p1', 'content'],
    startOffset: 1,
    endPath: ['p3', 'content'],
    endOffset: 5
  })
  surface.setSelection(sel)
  var TEXT = [
    '123456789',
    '0123456789',
    '01234'
  ]

  var event = new ClipboardEvent()
  clipboard.onCopy(event)

  var clipboardData = event.clipboardData
  t.equal(clipboardData.data['text/plain'], TEXT.join('\n'), "Plain text should be correct.")

  var htmlDoc = DefaultDOMElement.parseHTML(clipboardData.data['text/html'])
  var elements = htmlDoc.find('body').getChildren()
  t.equal(elements.length, 3, "HTML should consist of three elements.")
  var p1 = elements[0]
  t.equal(p1.attr('data-id'), 'p1', "First element should have correct data-id.")
  t.equal(p1.text(), TEXT[0], "First element should have correct text content.")
  var p2 = elements[1]
  t.equal(p2.attr('data-id'), 'p2', "Second element should have correct data-id.")
  t.equal(p2.text(), TEXT[1], "Second element should have correct text content.")
  var p3 = elements[2]
  t.equal(p3.attr('data-id'), 'p3', "Third element should have correct data-id.")
  t.equal(p3.text(), TEXT[2], "Third element should have correct text content.")
  t.end()
})

function _containerEditorSample(t) {
  var doc = fixture(simple)
  var documentSession = new DocumentSession(doc)
  var app = TestContainerEditor.mount({
    context: {
      editSession: documentSession,
      documentSession: documentSession,
      componentRegistry: componentRegistry,
      converterRegistry: converterRegistry
    },
    node: doc.get('body')
  }, t.sandbox)
  var editor = app.refs.editor
  var sel = doc.createSelection({
    type: 'property',
    path: ['p1', 'content'],
    startOffset: 1
  })
  // editor.setFocused(true)
  // HACK faking that the element is focused natively
  editor.isNativeFocused = true
  editor.setSelection(sel)

  return editor
}

test.UI("Pasting text into ContainerEditor using 'text/plain'.", function(t) {
  var editor = _containerEditorSample(t)
  var doc = editor.getDocument()
  var event = new ClipboardEvent()
  event.clipboardData.setData('text/plain', 'XXX')
  editor.clipboard.onPaste(event)
  t.equal(doc.get(['p1', 'content']), '0XXX123456789', "Plain text should be correct.")
  t.end()
})

test.UI("Pasting without any data given.", function(t) {
  var editor = _containerEditorSample(t)
  var doc = editor.getDocument()
  var event = new ClipboardEvent()
  editor.clipboard.onPaste(event)
  t.equal(doc.get(['p1', 'content']), '0123456789', "Text should be still the same.")
  t.end()
})


test.UI("Pasting text into ContainerEditor using 'text/html'.", function(t) {
  var editor = _containerEditorSample(t)
  var doc = editor.getDocument()
  var TEXT = 'XXX'
  var event = new ClipboardEvent()
  event.clipboardData.setData('text/plain', TEXT)
  event.clipboardData.setData('text/html', TEXT)
  editor.clipboard.onPaste(event)
  t.equal(doc.get(['p1', 'content']), '0XXX123456789', "Plain text should be correct.")
  t.end()
})

// this test revealed #700: the problem was that in source code there where
// `"` and `'` characters which did not survive the way through HTML correctly
test.UI("Copy and Pasting source code.", function(t) {
  var editor = _containerEditorSample(t)
  var doc = editor.getDocument()
  var body = doc.get('body')
  var cb = doc.create({
    type: 'codeblock',
    id: 'cb1',
    content: [
      "function hello_world() {",
      "  alert('Hello World!');",
      "}"
    ].join("\n")
  })
  body.show(cb, body.getPosition('p1')+1)
  editor.setSelection(doc.createSelection({
    type: 'container',
    containerId: 'body',
    startPath: ['p1', 'content'],
    startOffset: 1,
    endPath: ['p2', 'content'],
    endOffset: 1
  }))
  var event = new ClipboardEvent()
  editor.clipboard.onCut(event)
  var cb2 = doc.get('cb1')
  t.isNil(cb2, "Codeblock should have been cutted.")
  editor.clipboard.onPaste(event)
  cb2 = doc.get('cb1')
  t.notNil(cb2, "Codeblock should have been pasted.")
  t.deepEqual(cb2.toJSON(), cb.toJSON(), "Codeblock should have been pasted correctly.")
  t.end()
})

function _fixtureTest(t, fixture, impl, forceWindows) {
  var editor = _containerEditorSample(t)
  if (forceWindows) {
    // NOTE: faking 'Windows' mode in importer so that
    // the correct implementation will be used
    editor.clipboard.htmlImporter._isWindows = true
  }
  impl(editor, fixture)
}

function _plainTextTest(t, fixture, forceWindows) {
  _fixtureTest(t, fixture, function(editor, html) {
    var doc = editor.getDocument()
    var event = new ClipboardEvent()
    event.clipboardData.setData('text/plain', '')
    event.clipboardData.setData('text/html', html)
    editor.clipboard.onPaste(event)
    t.equal(doc.get(['p1', 'content']), '0XXX123456789', "Content should have been pasted correctly.")
    t.end()
  }, forceWindows)
}

function _annotatedTextTest(t, fixture, forceWindows) {
  _fixtureTest(t, fixture, function(editor, html) {
    var doc = editor.getDocument()
    var event = new ClipboardEvent()
    event.clipboardData.setData('text/plain', '')
    event.clipboardData.setData('text/html', html)
    editor.clipboard.onPaste(event)
    t.equal(doc.get(['p1', 'content']), '0XXX123456789', "Content should have been pasted correctly.")
    var annotations = doc.getIndex('annotations').get(['p1', 'content'])
    t.equal(annotations.length, 1, "There should be one annotation on the property now.")
    var anno = annotations[0]
    t.equal(anno.type, 'link', "The annotation should be a link.")
    t.end()
  }, forceWindows)
}

function _twoParagraphsTest(t, fixture, forceWindows) {
  _fixtureTest(t, fixture, function(editor, html) {
    var doc = editor.getDocument()
    var event = new ClipboardEvent()
    event.clipboardData.setData('text/plain', '')
    event.clipboardData.setData('text/html', html)
    editor.clipboard.onPaste(event)
    var body = doc.get('body')
    var p1 = body.getChildAt(0)
    t.equal(p1.content, '0AAA', "First paragraph should be truncated.")
    var p2 = body.getChildAt(1)
    t.equal(p2.content, 'BBB', "Second paragraph should contain 'BBB'.")
    var p3 = body.getChildAt(2)
    t.equal(p3.content, '123456789', "Remainder of original p1 should go into forth paragraph.")
    t.end()
  }, forceWindows)
}

test.UI("Browser - Chrome (OSX/Linux) - Plain Text", function(t) {
  _plainTextTest(t, BrowserLinuxPLainTextFixture)
})

test.UI("Browser - Chrome (OSX/Linux) - Annotated Text", function(t) {
  _annotatedTextTest(t, BrowserLinuxAnnotatedTextFixture)
})

test.UI("Browser - Chrome (OSX/Linux) - Two Paragraphs", function(t) {
  _twoParagraphsTest(t, BrowserLinuxTwoParagraphsFixture)
})

test.UI("Browser - Chrome (Windows) - Plain Text", function(t) {
  _plainTextTest(t, BrowserWindowsPlainTextFixture, 'forceWindows')
})

test.UI("Browser - Chrome (Windows) - Annotated Text", function(t) {
  _annotatedTextTest(t, BrowserWindowsAnnotatedTextFixture, 'forceWindows')
})

test.UI("Browser - Chrome (Windows) - Two Paragraphs", function(t) {
  _twoParagraphsTest(t, BrowserWindowsTwoParagraphsFixture, 'forceWindows')
})

test.UI("Browser - Firefox (Linux) - Plain Text", function(t) {
  _plainTextTest(t, BrowserLinuxFirefoxPlainTextFixture)
})

test.UI("Browser - Firefox (Linux) - Annotated Text", function(t) {
  _annotatedTextTest(t, BrowserLinuxFirefoxAnnotatedTextFixture)
})

test.UI("Browser - Firefox (Linux) - Two Paragraphs", function(t) {
  _twoParagraphsTest(t, BrowserLinuxFirefoxTwoParagraphsFixture)
})

test.UI("Browser - Firefox (Linux) - Whole Page", function(t) {
  _fixtureTest(t, BrowserLinuxFirefoxWholePageFixture, function(editor, html) {
    var doc = editor.getDocument()
    var event = new ClipboardEvent()
    event.clipboardData.setData('text/plain', 'XXX')
    event.clipboardData.setData('text/html', html)
    editor.clipboard.onPaste(event)
    // make sure HTML paste succeeded, by checking against the result of plain text insertion
    t.notOk(doc.get('p1').getText() === '0XXX123456789', "HTML conversion and paste should have been successful (not fall back to plain-text).")
    t.ok(doc.get('body').getLength() > 30, 'There should be a lot of paragraphs')
    t.end()
  })
})

test.UI("Browser - Firefox (OSX) - Plain Text", function(t) {
  _plainTextTest(t, BrowserOSXFirefoxPlainTextFixture)
})

test.UI("Browser - Firefox (OSX) - Annotated Text", function(t) {
  _annotatedTextTest(t, BrowserOSXFirefoxAnnotatedTextFixture)
})

test.UI("Browser - Firefox (OSX) - Two Paragraphs", function(t) {
  _twoParagraphsTest(t, BrowserOSXFirefoxTwoParagraphsFixture)
})

test.UI("Browser - Firefox (Windows) - Plain Text", function(t) {
  _plainTextTest(t, BrowserWindowsFirefoxPlainTextFixture, 'forceWindows')
})

test.UI("Browser - Firefox (Windows) - Annotated Text", function(t) {
  _annotatedTextTest(t, BrowserWindowsFirefoxAnnotatedTextFixture, 'forceWindows')
})

test.UI("Browser - Firefox (Windows) - Two Paragraphs", function(t) {
  _twoParagraphsTest(t, BrowserWindowsFirefoxTwoParagraphsFixture, 'forceWindows')
})

test.UI("Browser - Edge (Windows) - Plain Text", function(t) {
  _plainTextTest(t, BrowserWindowsEdgePlainTextFixture, 'forceWindows')
})

test.UI("Browser - Edge (Windows) - Annotated Text", function(t) {
  _annotatedTextTest(t, BrowserWindowsEdgeAnnotatedTextFixture, 'forceWindows')
})

test.UI("Browser - Edge (Windows) - Two Paragraphs", function(t) {
  _twoParagraphsTest(t, BrowserWindowsEdgeTwoParagraphsFixture, 'forceWindows')
})

test.UI("GoogleDocs - Chrome (OSX/Linux) - Plain Text", function(t) {
  _plainTextTest(t, GDocsOSXLinuxChromePlainTextFixture)
})

test.UI("GoogleDocs - Chrome (OSX/Linux) - Annotated Text", function(t) {
  _annotatedTextTest(t, GDocsOSXLinuxChromeAnnotatedTextFixture)
})

test.UI("GoogleDocs - Chrome (OSX/Linux) - Two Paragraphs", function(t) {
  _twoParagraphsTest(t, GDocsOSXLinuxChromeTwoParagraphsFixture)
})

test.UI("GoogleDocs - Firefox (Linux) - Plain Text", function(t) {
  _plainTextTest(t, GDocsLinuxFirefoxPlainTextFixture)
})

test.UI("GoogleDocs - Firefox (Linux) - Annotated Text", function(t) {
  _annotatedTextTest(t, GDocsLinuxFirefoxAnnotatedTextFixture)
})

test.UI("GoogleDocs - Firefox (OSX) - Plain Text", function(t) {
  _plainTextTest(t, GDocsOSXFirefoxPlainTextFixture)
})

test.UI("LibreOffice (OSX/Linux) - Plain Text", function(t) {
  _plainTextTest(t, LibreOfficeOSXPlainTextFixture)
})

test.UI("LibreOffice (OSX/Linux) - Annotated Text", function(t) {
  _annotatedTextTest(t, LibreOfficeOSXAnnotatedTextFixture)
})

test.UI("LibreOffice (OSX/Linux) - Two Paragraphs", function(t) {
  _twoParagraphsTest(t, LibreOfficeOSXTwoParagraphsFixture)
})

test.UI("Microsoft Word 11 (OSX) - Plain Text", function(t) {
  _plainTextTest(t, MSW11OSXPlainTextFixture)
})

test.UI("Microsoft Word 11 (OSX) - Annotated Text", function(t) {
  _annotatedTextTest(t, MSW11OSXAnnotatedTextFixture)
})

test.UI("Microsoft Word 11 (OSX) - Two Paragraphs", function(t) {
  _twoParagraphsTest(t, MSW11OSXTwoParagraphsFixture)
})
