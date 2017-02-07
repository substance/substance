import { module } from 'substance-test'

import inBrowser from '../util/inBrowser'
import Clipboard from '../ui/Clipboard'
import DefaultDOMElement from '../dom/DefaultDOMElement'
import Registry from '../util/Registry'
import ParagraphHTMLConverter from '../packages/paragraph/ParagraphHTMLConverter'
import HeadingHTMLConverter from '../packages/heading/HeadingHTMLConverter'
import StrongHTMLConverter from '../packages/strong/StrongHTMLConverter'
import EmphasisHTMLConverter from '../packages/emphasis/EmphasisHTMLConverter'
import LinkHTMLConverter from '../packages/link/LinkHTMLConverter'
import CodeblockHTMLConverter from '../packages/codeblock/CodeblockHTMLConverter'

import simple from './fixture/simple'
import setupEditor from './fixture/setupEditor'
import BrowserLinuxPLainTextFixture from './fixture/html/browser-linux-plain-text'
import BrowserLinuxAnnotatedTextFixture from './fixture/html/browser-linux-annotated-text'
import BrowserLinuxTwoParagraphsFixture from './fixture/html/browser-linux-two-paragraphs'
import BrowserWindowsPlainTextFixture from './fixture/html/browser-windows-plain-text'
import BrowserWindowsAnnotatedTextFixture from './fixture/html/browser-windows-annotated-text'
import BrowserWindowsTwoParagraphsFixture from './fixture/html/browser-windows-two-paragraphs'
import BrowserLinuxFirefoxPlainTextFixture from './fixture/html/browser-linux-firefox-plain-text'
import BrowserLinuxFirefoxAnnotatedTextFixture from './fixture/html/browser-linux-firefox-annotated-text'
import BrowserLinuxFirefoxTwoParagraphsFixture from './fixture/html/browser-linux-firefox-two-paragraphs'
import BrowserLinuxFirefoxWholePageFixture from './fixture/html/browser-linux-firefox-whole-page'
import BrowserOSXFirefoxPlainTextFixture from './fixture/html/browser-osx-firefox-plain-text'
import BrowserOSXFirefoxAnnotatedTextFixture from './fixture/html/browser-osx-firefox-annotated-text'
import BrowserOSXFirefoxTwoParagraphsFixture from './fixture/html/browser-osx-firefox-two-paragraphs'
import BrowserWindowsFirefoxPlainTextFixture from './fixture/html/browser-windows-firefox-plain-text'
import BrowserWindowsFirefoxAnnotatedTextFixture from './fixture/html/browser-windows-firefox-annotated-text'
import BrowserWindowsFirefoxTwoParagraphsFixture from './fixture/html/browser-windows-firefox-two-paragraphs'
import BrowserWindowsEdgePlainTextFixture from './fixture/html/browser-windows-edge-plain-text'
import BrowserWindowsEdgeAnnotatedTextFixture from './fixture/html/browser-windows-edge-annotated-text'
import BrowserWindowsEdgeTwoParagraphsFixture from './fixture/html/browser-windows-edge-two-paragraphs'
import GDocsOSXLinuxChromePlainTextFixture from './fixture/html/google-docs-osx-linux-chrome-plain-text'
import GDocsOSXLinuxChromeAnnotatedTextFixture from './fixture/html/google-docs-osx-linux-chrome-annotated-text'
import GDocsOSXLinuxChromeTwoParagraphsFixture from './fixture/html/google-docs-osx-linux-chrome-two-paragraphs'
import GDocsLinuxFirefoxPlainTextFixture from './fixture/html/google-docs-linux-firefox-plain-text'
import GDocsLinuxFirefoxAnnotatedTextFixture from './fixture/html/google-docs-linux-firefox-annotated-text'
import GDocsOSXFirefoxPlainTextFixture from './fixture/html/google-docs-osx-firefox-plain-text'
import LibreOfficeOSXPlainTextFixture from './fixture/html/libre-office-osx-linux-plain-text'
import LibreOfficeOSXAnnotatedTextFixture from './fixture/html/libre-office-osx-linux-annotated-text'
import LibreOfficeOSXTwoParagraphsFixture from './fixture/html/libre-office-osx-linux-two-paragraphs'
import MSW11OSXPlainTextFixture from './fixture/html/word-11-osx-plain-text'
import MSW11OSXAnnotatedTextFixture from './fixture/html/word-11-osx-annotated-text'
import MSW11OSXTwoParagraphsFixture from './fixture/html/word-11-osx-two-paragraphs'


ClipboardTests()

if (inBrowser) {
  ClipboardTests('memory')
}


function ClipboardTests(memory) {

  const test = module('Clipboard' + (memory ? ' [memory]' : ''), {
    before: function() {
      if (memory) DefaultDOMElement._useXNode()
    },
    after: function() {
      DefaultDOMElement._reset()
    }
  })

  test("Copying HTML, and plain text", function(t) {
    let { editorSession, clipboard } = _fixture(t, simple)
    editorSession.setSelection({ type: 'property', path: ['p1', 'content'], startOffset: 0, endOffset: 5 })
    let event = new ClipboardEvent()
    clipboard.onCopy(event)
    let clipboardData = event.clipboardData
    t.notNil(clipboardData.data['text/plain'], "Clipboard should contain plain text data.")
    t.notNil(clipboardData.data['text/html'], "Clipboard should contain HTML data.")
    let htmlDoc = DefaultDOMElement.parseHTML(clipboardData.data['text/html'])
    let body = htmlDoc.find('body')
    t.notNil(body, 'The copied HTML should always be a full HTML document string, containing a body element.')
    t.end()
  })

  test("Copying a property selection", function(t) {
    let { editorSession, clipboard } = _fixture(t, simple)
    editorSession.setSelection({ type: 'property', path: ['p1', 'content'], startOffset: 0, endOffset: 5 })
    let TEXT = '01234'
    let event = new ClipboardEvent()
    clipboard.onCopy(event)

    let clipboardData = event.clipboardData
    t.equal(clipboardData.data['text/plain'], TEXT, "Plain text should be correct.")

    let htmlDoc = DefaultDOMElement.parseHTML(clipboardData.data['text/html'])
    let body = htmlDoc.find('body')
    let childNodes = body.getChildNodes()
    t.equal(childNodes.length, 1, "There should be only one element")
    let el = childNodes[0]
    t.equal(el.nodeType, 'text', "HTML element should be a text node.")
    t.equal(el.text(), TEXT, "HTML text should be correct.")
    t.end()
  })

  test("Copying a container selection", function(t) {
    let { editorSession, clipboard } = _fixture(t, simple)
    editorSession.setSelection({
      type: 'container',
      containerId: 'body',
      startPath: ['p1', 'content'],
      startOffset: 1,
      endPath: ['p3', 'content'],
      endOffset: 5
    })
    let TEXT = [
      '123456789',
      '0123456789',
      '01234'
    ]

    let event = new ClipboardEvent()
    clipboard.onCopy(event)

    let clipboardData = event.clipboardData
    t.equal(clipboardData.data['text/plain'], TEXT.join('\n'), "Plain text should be correct.")

    let htmlDoc = DefaultDOMElement.parseHTML(clipboardData.data['text/html'])
    let elements = htmlDoc.find('body').getChildren()
    t.equal(elements.length, 3, "HTML should consist of three elements.")
    let p1 = elements[0]
    t.equal(p1.attr('data-id'), 'p1', "First element should have correct data-id.")
    t.equal(p1.text(), TEXT[0], "First element should have correct text content.")
    let p2 = elements[1]
    t.equal(p2.attr('data-id'), 'p2', "Second element should have correct data-id.")
    t.equal(p2.text(), TEXT[1], "Second element should have correct text content.")
    let p3 = elements[2]
    t.equal(p3.attr('data-id'), 'p3', "Third element should have correct data-id.")
    t.equal(p3.text(), TEXT[2], "Third element should have correct text content.")
    t.end()
  })

  test("Pasting text into ContainerEditor using 'text/plain'.", function(t) {
    let { editorSession, clipboard, doc } = _fixture(t, simple)
    editorSession.setSelection({
      type: 'property',
      path: ['p1', 'content'],
      startOffset: 1,
      containerId: 'body'
    })
    let event = new ClipboardEvent()
    event.clipboardData.setData('text/plain', 'XXX')
    clipboard.onPaste(event)
    t.equal(doc.get(['p1', 'content']), '0XXX123456789', "Plain text should be correct.")
    t.end()
  })

  test("Pasting without any data given.", function(t) {
    let { editorSession, clipboard, doc } = _fixture(t, simple)
    editorSession.setSelection({
      type: 'property',
      path: ['p1', 'content'],
      startOffset: 1,
      containerId: 'body'
    })
    let event = new ClipboardEvent()
    clipboard.onPaste(event)
    t.equal(doc.get(['p1', 'content']), '0123456789', "Text should be still the same.")
    t.end()
  })

  test("Pasting text into ContainerEditor using 'text/html'.", function(t) {
    let { editorSession, clipboard, doc } = _fixture(t, simple)
    editorSession.setSelection({
      type: 'property',
      path: ['p1', 'content'],
      startOffset: 1,
      containerId: 'body'
    })
    let TEXT = 'XXX'
    let event = new ClipboardEvent()
    event.clipboardData.setData('text/plain', TEXT)
    event.clipboardData.setData('text/html', TEXT)
    clipboard.onPaste(event)
    t.equal(doc.get(['p1', 'content']), '0XXX123456789', "Plain text should be correct.")
    t.end()
  })

  // this test revealed #700: the problem was that in source code there where
  // `"` and `'` characters which did not survive the way through HTML correctly
  test("Copy and Pasting source code.", function(t) {
    let { editorSession, clipboard, doc } = _fixture(t, simple)
    let body = doc.get('body')
    let cb = doc.create({
      type: 'codeblock',
      id: 'cb1',
      content: [
        "function hello_world() {",
        "  alert('Hello World!');",
        "}"
      ].join("\n")
    })
    body.show(cb, body.getPosition('p1')+1)
    editorSession.setSelection(doc.createSelection({
      type: 'container',
      startPath: ['p1', 'content'],
      startOffset: 1,
      endPath: ['p2', 'content'],
      endOffset: 1,
      containerId: 'body',
    }))
    let event = new ClipboardEvent()
    clipboard.onCut(event)
    let cb1 = doc.get('cb1')
    t.isNil(cb1, "Codeblock should have been cutted.")
    clipboard.onPaste(event)
    cb1 = doc.get('cb1')
    t.notNil(cb1, "Codeblock should have been pasted.")
    t.deepEqual(cb1.toJSON(), cb.toJSON(), "Codeblock should have been pasted correctly.")
    t.end()
  })

  test("Browser - Chrome (OSX/Linux) - Plain Text", function(t) {
    _plainTextTest(t, BrowserLinuxPLainTextFixture)
  })

  test("Browser - Chrome (OSX/Linux) - Annotated Text", function(t) {
    _annotatedTextTest(t, BrowserLinuxAnnotatedTextFixture)
  })

  test("Browser - Chrome (OSX/Linux) - Two Paragraphs", function(t) {
    _twoParagraphsTest(t, BrowserLinuxTwoParagraphsFixture)
  })

  test("Browser - Chrome (Windows) - Plain Text", function(t) {
    _plainTextTest(t, BrowserWindowsPlainTextFixture, 'forceWindows')
  })

  test("Browser - Chrome (Windows) - Annotated Text", function(t) {
    _annotatedTextTest(t, BrowserWindowsAnnotatedTextFixture, 'forceWindows')
  })

  test("Browser - Chrome (Windows) - Two Paragraphs", function(t) {
    _twoParagraphsTest(t, BrowserWindowsTwoParagraphsFixture, 'forceWindows')
  })

  test("Browser - Firefox (Linux) - Plain Text", function(t) {
    _plainTextTest(t, BrowserLinuxFirefoxPlainTextFixture)
  })

  test("Browser - Firefox (Linux) - Annotated Text", function(t) {
    _annotatedTextTest(t, BrowserLinuxFirefoxAnnotatedTextFixture)
  })

  test("Browser - Firefox (Linux) - Two Paragraphs", function(t) {
    _twoParagraphsTest(t, BrowserLinuxFirefoxTwoParagraphsFixture)
  })

  test("Browser - Firefox (Linux) - Whole Page", function(t) {
    let html = BrowserLinuxFirefoxWholePageFixture
    _fixtureTest(t, html, function(doc, clipboard) {
      let event = new ClipboardEvent()
      event.clipboardData.setData('text/plain', 'XXX')
      event.clipboardData.setData('text/html', html)
      clipboard.onPaste(event)
      // make sure HTML paste succeeded, by checking against the result of plain text insertion
      t.notOk(doc.get('p1').getText() === '0XXX123456789', "HTML conversion and paste should have been successful (not fall back to plain-text).")
      t.ok(doc.get('body').getLength() > 30, 'There should be a lot of paragraphs')
      t.end()
    })
  })

  test("Browser - Firefox (OSX) - Plain Text", function(t) {
    _plainTextTest(t, BrowserOSXFirefoxPlainTextFixture)
  })

  test("Browser - Firefox (OSX) - Annotated Text", function(t) {
    _annotatedTextTest(t, BrowserOSXFirefoxAnnotatedTextFixture)
  })

  test("Browser - Firefox (OSX) - Two Paragraphs", function(t) {
    _twoParagraphsTest(t, BrowserOSXFirefoxTwoParagraphsFixture)
  })

  test("Browser - Firefox (Windows) - Plain Text", function(t) {
    _plainTextTest(t, BrowserWindowsFirefoxPlainTextFixture, 'forceWindows')
  })

  test("Browser - Firefox (Windows) - Annotated Text", function(t) {
    _annotatedTextTest(t, BrowserWindowsFirefoxAnnotatedTextFixture, 'forceWindows')
  })

  test("Browser - Firefox (Windows) - Two Paragraphs", function(t) {
    _twoParagraphsTest(t, BrowserWindowsFirefoxTwoParagraphsFixture, 'forceWindows')
  })

  test("Browser - Edge (Windows) - Plain Text", function(t) {
    _plainTextTest(t, BrowserWindowsEdgePlainTextFixture, 'forceWindows')
  })

  test("Browser - Edge (Windows) - Annotated Text", function(t) {
    _annotatedTextTest(t, BrowserWindowsEdgeAnnotatedTextFixture, 'forceWindows')
  })

  test("Browser - Edge (Windows) - Two Paragraphs", function(t) {
    _twoParagraphsTest(t, BrowserWindowsEdgeTwoParagraphsFixture, 'forceWindows')
  })

  test("GoogleDocs - Chrome (OSX/Linux) - Plain Text", function(t) {
    _plainTextTest(t, GDocsOSXLinuxChromePlainTextFixture)
  })

  test("GoogleDocs - Chrome (OSX/Linux) - Annotated Text", function(t) {
    _annotatedTextTest(t, GDocsOSXLinuxChromeAnnotatedTextFixture)
  })

  test("GoogleDocs - Chrome (OSX/Linux) - Two Paragraphs", function(t) {
    _twoParagraphsTest(t, GDocsOSXLinuxChromeTwoParagraphsFixture)
  })

  test("GoogleDocs - Firefox (Linux) - Plain Text", function(t) {
    _plainTextTest(t, GDocsLinuxFirefoxPlainTextFixture)
  })

  test("GoogleDocs - Firefox (Linux) - Annotated Text", function(t) {
    _annotatedTextTest(t, GDocsLinuxFirefoxAnnotatedTextFixture)
  })

  test("GoogleDocs - Firefox (OSX) - Plain Text", function(t) {
    _plainTextTest(t, GDocsOSXFirefoxPlainTextFixture)
  })

  test("LibreOffice (OSX/Linux) - Plain Text", function(t) {
    _plainTextTest(t, LibreOfficeOSXPlainTextFixture)
  })

  test("LibreOffice (OSX/Linux) - Annotated Text", function(t) {
    _annotatedTextTest(t, LibreOfficeOSXAnnotatedTextFixture)
  })

  test("LibreOffice (OSX/Linux) - Two Paragraphs", function(t) {
    _twoParagraphsTest(t, LibreOfficeOSXTwoParagraphsFixture)
  })

  test("Microsoft Word 11 (OSX) - Plain Text", function(t) {
    _plainTextTest(t, MSW11OSXPlainTextFixture)
  })

  test("Microsoft Word 11 (OSX) - Annotated Text", function(t) {
    _annotatedTextTest(t, MSW11OSXAnnotatedTextFixture)
  })

  test("Microsoft Word 11 (OSX) - Two Paragraphs", function(t) {
    _twoParagraphsTest(t, MSW11OSXTwoParagraphsFixture)
  })

}


let converterRegistry = new Registry({
  "html": new Registry({
    "paragraph": ParagraphHTMLConverter,
    "heading": HeadingHTMLConverter,
    "strong": StrongHTMLConverter,
    "emphasis": EmphasisHTMLConverter,
    "link": LinkHTMLConverter,
    "codeblock": CodeblockHTMLConverter,
  })
})

let clipboardConfig = {
  converterRegistry: converterRegistry
}

class ClipboardEventData {
  constructor() {
    this.data = {}
  }

  getData(format) {
    return this.data[format]
  }

  setData(format, data) {
    this.data[format] = data
  }

  get types() {
    return Object.keys(this.data)
  }
}

class ClipboardEvent {
  constructor() {
    this.clipboardData = new ClipboardEventData()
  }
  preventDefault() {}
  stopPropagation() {}
}

function _fixture(t, seed) {
  let { editorSession, doc } = setupEditor(t, seed)
  let clipboard = new Clipboard(editorSession, clipboardConfig)
  return { editorSession, doc, clipboard }
}

function _fixtureTest(t, html, impl, forceWindows) {
  let { editorSession, clipboard, doc } = _fixture(t, simple)
  if (forceWindows) {
    // NOTE: faking 'Windows' mode in importer so that
    // the correct implementation will be used
    clipboard.htmlImporter._isWindows = true
  }
  editorSession.setSelection({
    type: 'property',
    path: ['p1', 'content'],
    startOffset: 1,
    containerId: 'body'
  })
  impl(doc, clipboard)
}

function _plainTextTest(t, html, forceWindows) {
  _fixtureTest(t, html, function(doc, clipboard) {
    let event = new ClipboardEvent()
    event.clipboardData.setData('text/plain', '')
    event.clipboardData.setData('text/html', html)
    clipboard.onPaste(event)
    t.equal(doc.get(['p1', 'content']), '0XXX123456789', "Content should have been pasted correctly.")
    t.end()
  }, forceWindows)
}

function _annotatedTextTest(t, html, forceWindows) {
  _fixtureTest(t, html, function(doc, clipboard) {
    let event = new ClipboardEvent()
    event.clipboardData.setData('text/plain', '')
    event.clipboardData.setData('text/html', html)
    clipboard.onPaste(event)
    t.equal(doc.get(['p1', 'content']), '0XXX123456789', "Content should have been pasted correctly.")
    let annotations = doc.getIndex('annotations').get(['p1', 'content'])
    t.equal(annotations.length, 1, "There should be one annotation on the property now.")
    let anno = annotations[0]
    t.equal(anno.type, 'link', "The annotation should be a link.")
    t.end()
  }, forceWindows)
}

function _twoParagraphsTest(t, html, forceWindows) {
  _fixtureTest(t, html, function(doc, clipboard) {
    let event = new ClipboardEvent()
    event.clipboardData.setData('text/plain', '')
    event.clipboardData.setData('text/html', html)
    clipboard.onPaste(event)
    let body = doc.get('body')
    let p1 = body.getChildAt(0)
    t.equal(p1.content, '0AAA', "First paragraph should be truncated.")
    let p2 = body.getChildAt(1)
    t.equal(p2.content, 'BBB', "Second paragraph should contain 'BBB'.")
    let p3 = body.getChildAt(2)
    t.equal(p3.content, '123456789', "Remainder of original p1 should go into forth paragraph.")
    t.end()
  }, forceWindows)
}
