import { test as substanceTest } from 'substance-test'
import {
  DefaultDOMElement, Clipboard,
  platform, find
} from 'substance'

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
import GDocsOSXLinuxChromeExtendedFixture from './fixture/html/google-docs-osx-linux-chrome-extended'
import GDocsLinuxFirefoxPlainTextFixture from './fixture/html/google-docs-linux-firefox-plain-text'
import GDocsLinuxFirefoxAnnotatedTextFixture from './fixture/html/google-docs-linux-firefox-annotated-text'
import GDocsOSXFirefoxPlainTextFixture from './fixture/html/google-docs-osx-firefox-plain-text'
import LibreOfficeOSXPlainTextFixture from './fixture/html/libre-office-osx-linux-plain-text'
import LibreOfficeOSXAnnotatedTextFixture from './fixture/html/libre-office-osx-linux-annotated-text'
import LibreOfficeOSXTwoParagraphsFixture from './fixture/html/libre-office-osx-linux-two-paragraphs'
import LibreOfficeOSXExtendedFixture from './fixture/html/libre-office-osx-linux-extended'
import MSW11OSXPlainTextFixture from './fixture/html/word-11-osx-plain-text'
import MSW11OSXAnnotatedTextFixture from './fixture/html/word-11-osx-annotated-text'
import MSW11OSXTwoParagraphsFixture from './fixture/html/word-11-osx-two-paragraphs'
import MSW11OSXExtendedFixture from './fixture/html/word-11-osx-extended'

ClipboardTests()

if (platform.inBrowser) {
  ClipboardTests('memory')
}

function ClipboardTests (memory) {
  const LABEL = `Clipboard${memory ? ' [memory]' : ''}`
  const test = (title, fn) => substanceTest(`${LABEL}: ${title}`, fn, {
    before () {
      if (memory) platform.inBrowser = false
    },
    after () {
      platform._reset()
    }
  })

  test('Copying HTML, and plain text', t => {
    let { editorSession, clipboard } = _fixture(t, simple)
    editorSession.setSelection({ type: 'property', path: ['p1', 'content'], startOffset: 0, endOffset: 5 })
    let event = new ClipboardEvent()
    clipboard.onCopy(event)
    let clipboardData = event.clipboardData
    t.notNil(clipboardData.data['text/plain'], 'Clipboard should contain plain text data.')
    t.notNil(clipboardData.data['text/html'], 'Clipboard should contain HTML data.')
    let htmlDoc = DefaultDOMElement.parseHTML(clipboardData.data['text/html'])
    let body = htmlDoc.find('body')
    t.notNil(body, 'The copied HTML should always be a full HTML document string, containing a body element.')
    t.end()
  })

  test('Copying a property selection', t => {
    let { editorSession, clipboard } = _fixture(t, simple)
    editorSession.setSelection({ type: 'property', path: ['p1', 'content'], startOffset: 0, endOffset: 5 })
    let TEXT = '01234'
    let event = new ClipboardEvent()
    clipboard.onCopy(event)

    let clipboardData = event.clipboardData
    t.equal(clipboardData.data['text/plain'], TEXT, 'Plain text should be correct.')

    let htmlDoc = DefaultDOMElement.parseHTML(clipboardData.data['text/html'])
    let body = htmlDoc.find('body')
    t.equal(body.text(), TEXT, 'HTML text should be correct.')
    t.end()
  })

  test('Copying a container selection', t => {
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
    t.equal(clipboardData.data['text/plain'], TEXT.join('\n'), 'Plain text should be correct.')

    let htmlDoc = DefaultDOMElement.parseHTML(clipboardData.data['text/html'])
    let elements = htmlDoc.find('body').getChildren()
    t.equal(elements.length, 3, 'HTML should consist of three elements.')
    let p1 = elements[0]
    t.equal(p1.attr('data-id'), 'p1', 'First element should have correct data-id.')
    t.equal(p1.text(), TEXT[0], 'First element should have correct text content.')
    let p2 = elements[1]
    t.equal(p2.attr('data-id'), 'p2', 'Second element should have correct data-id.')
    t.equal(p2.text(), TEXT[1], 'Second element should have correct text content.')
    let p3 = elements[2]
    t.equal(p3.attr('data-id'), 'p3', 'Third element should have correct data-id.')
    t.equal(p3.text(), TEXT[2], 'Third element should have correct text content.')
    t.end()
  })

  test("Pasting text into ContainerEditor using 'text/plain'.", t => {
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
    t.equal(doc.get(['p1', 'content']), '0XXX123456789', 'Plain text should be correct.')
    t.end()
  })

  test('Pasting without any data given.', t => {
    let { editorSession, clipboard, doc } = _fixture(t, simple)
    editorSession.setSelection({
      type: 'property',
      path: ['p1', 'content'],
      startOffset: 1,
      containerId: 'body'
    })
    let event = new ClipboardEvent()
    clipboard.onPaste(event)
    t.equal(doc.get(['p1', 'content']), '0123456789', 'Text should be still the same.')
    t.end()
  })

  test("Pasting text into ContainerEditor using 'text/html'.", t => {
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
    t.equal(doc.get(['p1', 'content']), '0XXX123456789', 'Plain text should be correct.')
    t.end()
  })

  // this test revealed #700: the problem was that in source code there where
  // `"` and `'` characters which did not survive the way through HTML correctly
  test('Copy and Pasting source code.', t => {
    let { editorSession, clipboard, doc } = _fixture(t, simple)
    let body = doc.get('body')
    let cb = doc.create({
      type: 'codeblock',
      id: 'cb1',
      content: [
        'function hello_world() {',
        "  alert('Hello World!');",
        '}'
      ].join('\n')
    })
    body.showAt(body.getPosition('p1') + 1, cb)
    editorSession.setSelection(doc.createSelection({
      type: 'container',
      startPath: ['p1', 'content'],
      startOffset: 1,
      endPath: ['p2', 'content'],
      endOffset: 1,
      containerId: 'body'
    }))
    let event = new ClipboardEvent()
    clipboard.onCut(event)
    let cb1 = doc.get('cb1')
    t.isNil(cb1, 'Codeblock should have been cutted.')
    clipboard.onPaste(event)
    cb1 = doc.get('cb1')
    t.notNil(cb1, 'Codeblock should have been pasted.')
    t.deepEqual(cb1.toJSON(), cb.toJSON(), 'Codeblock should have been pasted correctly.')
    t.end()
  })

  test('Browser - Chrome (OSX/Linux) - Plain Text', t => {
    _plainTextTest(t, BrowserLinuxPLainTextFixture)
  })

  test('Browser - Chrome (OSX/Linux) - Annotated Text', t => {
    _annotatedTextTest(t, BrowserLinuxAnnotatedTextFixture)
  })

  test('Browser - Chrome (OSX/Linux) - Two Paragraphs', t => {
    _twoParagraphsTest(t, BrowserLinuxTwoParagraphsFixture)
  })

  test('Browser - Chrome (Windows) - Plain Text', t => {
    _plainTextTest(t, BrowserWindowsPlainTextFixture, 'forceWindows')
  })

  test('Browser - Chrome (Windows) - Annotated Text', t => {
    _annotatedTextTest(t, BrowserWindowsAnnotatedTextFixture, 'forceWindows')
  })

  test('Browser - Chrome (Windows) - Two Paragraphs', t => {
    _twoParagraphsTest(t, BrowserWindowsTwoParagraphsFixture, 'forceWindows')
  })

  test('Browser - Firefox (Linux) - Plain Text', t => {
    _plainTextTest(t, BrowserLinuxFirefoxPlainTextFixture)
  })

  test('Browser - Firefox (Linux) - Annotated Text', t => {
    _annotatedTextTest(t, BrowserLinuxFirefoxAnnotatedTextFixture)
  })

  test('Browser - Firefox (Linux) - Two Paragraphs', t => {
    _twoParagraphsTest(t, BrowserLinuxFirefoxTwoParagraphsFixture)
  })

  test('Browser - Firefox (Linux) - Whole Page', t => {
    let html = BrowserLinuxFirefoxWholePageFixture
    _fixtureTest(t, html, function (doc, clipboard) {
      let event = new ClipboardEvent()
      event.clipboardData.setData('text/plain', 'XXX')
      event.clipboardData.setData('text/html', html)
      clipboard.onPaste(event)
      // make sure HTML paste succeeded, by checking against the result of plain text insertion
      t.notOk(doc.get('p1').getText() === '0XXX123456789', 'HTML conversion and paste should have been successful (not fall back to plain-text).')
      t.ok(doc.get('body').getLength() > 30, 'There should be a lot of paragraphs')
      t.end()
    })
  })

  test('Browser - Firefox (OSX) - Plain Text', t => {
    _plainTextTest(t, BrowserOSXFirefoxPlainTextFixture)
  })

  test('Browser - Firefox (OSX) - Annotated Text', t => {
    _annotatedTextTest(t, BrowserOSXFirefoxAnnotatedTextFixture)
  })

  test('Browser - Firefox (OSX) - Two Paragraphs', t => {
    _twoParagraphsTest(t, BrowserOSXFirefoxTwoParagraphsFixture)
  })

  test('Browser - Firefox (Windows) - Plain Text', t => {
    _plainTextTest(t, BrowserWindowsFirefoxPlainTextFixture, 'forceWindows')
  })

  test('Browser - Firefox (Windows) - Annotated Text', t => {
    _annotatedTextTest(t, BrowserWindowsFirefoxAnnotatedTextFixture, 'forceWindows')
  })

  test('Browser - Firefox (Windows) - Two Paragraphs', t => {
    _twoParagraphsTest(t, BrowserWindowsFirefoxTwoParagraphsFixture, 'forceWindows')
  })

  test('Browser - Edge (Windows) - Plain Text', t => {
    _plainTextTest(t, BrowserWindowsEdgePlainTextFixture, 'forceWindows')
  })

  test('Browser - Edge (Windows) - Annotated Text', t => {
    _annotatedTextTest(t, BrowserWindowsEdgeAnnotatedTextFixture, 'forceWindows')
  })

  test('Browser - Edge (Windows) - Two Paragraphs', t => {
    _twoParagraphsTest(t, BrowserWindowsEdgeTwoParagraphsFixture, 'forceWindows')
  })

  test('GoogleDocs - Chrome (OSX/Linux) - Plain Text', t => {
    _plainTextTest(t, GDocsOSXLinuxChromePlainTextFixture)
  })

  test('GoogleDocs - Chrome (OSX/Linux) - Annotated Text', t => {
    _annotatedTextTest(t, GDocsOSXLinuxChromeAnnotatedTextFixture)
  })

  test('GoogleDocs - Chrome (OSX/Linux) - Two Paragraphs', t => {
    _twoParagraphsTest(t, GDocsOSXLinuxChromeTwoParagraphsFixture)
  })

  test('GoogleDocs - Chrome (OSX/Linux) - Extended', t => {
    _extendedTest(t, GDocsOSXLinuxChromeExtendedFixture)
  })

  test('GoogleDocs - Firefox (Linux) - Plain Text', t => {
    _plainTextTest(t, GDocsLinuxFirefoxPlainTextFixture)
  })

  test('GoogleDocs - Firefox (Linux) - Annotated Text', t => {
    _annotatedTextTest(t, GDocsLinuxFirefoxAnnotatedTextFixture)
  })

  test('GoogleDocs - Firefox (OSX) - Plain Text', t => {
    _plainTextTest(t, GDocsOSXFirefoxPlainTextFixture)
  })

  test('LibreOffice (OSX/Linux) - Plain Text', t => {
    _plainTextTest(t, LibreOfficeOSXPlainTextFixture)
  })

  test('LibreOffice (OSX/Linux) - Annotated Text', t => {
    _annotatedTextTest(t, LibreOfficeOSXAnnotatedTextFixture)
  })

  test('LibreOffice (OSX/Linux) - Two Paragraphs', t => {
    _twoParagraphsTest(t, LibreOfficeOSXTwoParagraphsFixture)
  })

  test('LibreOffice (OSX/Linux) - Extended', t => {
    _extendedTest(t, LibreOfficeOSXExtendedFixture)
  })

  test('Microsoft Word 11 (OSX) - Plain Text', t => {
    _plainTextTest(t, MSW11OSXPlainTextFixture)
  })

  test('Microsoft Word 11 (OSX) - Annotated Text', t => {
    _annotatedTextTest(t, MSW11OSXAnnotatedTextFixture)
  })

  test('Microsoft Word 11 (OSX) - Two Paragraphs', t => {
    _twoParagraphsTest(t, MSW11OSXTwoParagraphsFixture)
  })

  test('Microsoft Word 11 (OSX) - Extended', t => {
    _extendedTest(t, MSW11OSXExtendedFixture)
  })
}

class ClipboardEventData {
  constructor () {
    this.data = {}
  }

  getData (format) {
    return this.data[format]
  }

  setData (format, data) {
    this.data[format] = data
  }

  get types () {
    return Object.keys(this.data)
  }
}

class ClipboardEvent {
  constructor () {
    this.clipboardData = new ClipboardEventData()
  }
  preventDefault () {}
  stopPropagation () {}
}

function _fixture (t, seed) {
  let { configurator, editorSession, doc } = setupEditor(t, seed)
  let clipboard = new Clipboard(configurator, editorSession)
  return { editorSession, doc, clipboard }
}

function _fixtureTest (t, html, impl, forceWindows) {
  let { editorSession, clipboard, doc } = _fixture(t, simple)
  let _isWindows = platform.isWindows
  platform.isWindows = Boolean(forceWindows)
  editorSession.setSelection({
    type: 'property',
    path: ['p1', 'content'],
    startOffset: 1,
    containerId: 'body'
  })
  impl(doc, clipboard)
  platform.isWindows = _isWindows
}

function _emptyParagraphSeed (tx) {
  let body = tx.get('body')
  tx.create({
    type: 'paragraph',
    id: 'p1',
    content: ''
  })
  body.show('p1')
}

function _emptyFixtureTest (t, html, impl, forceWindows) {
  let { editorSession, clipboard, doc } = _fixture(t, _emptyParagraphSeed)
  if (forceWindows) {
    // NOTE: faking 'Windows' mode in importer so that
    // the correct implementation will be used
    clipboard.htmlImporter._isWindows = true
  }
  editorSession.setSelection({
    type: 'property',
    path: ['p1', 'content'],
    startOffset: 0,
    containerId: 'body'
  })
  impl(doc, clipboard)
}

function _plainTextTest (t, html, forceWindows) {
  _fixtureTest(t, html, function (doc, clipboard) {
    let event = new ClipboardEvent()
    event.clipboardData.setData('text/plain', '')
    event.clipboardData.setData('text/html', html)
    clipboard.onPaste(event)
    t.equal(doc.get(['p1', 'content']), '0XXX123456789', 'Content should have been pasted correctly.')
    t.end()
  }, forceWindows)
}

function _annotatedTextTest (t, html, forceWindows) {
  _fixtureTest(t, html, function (doc, clipboard) {
    let event = new ClipboardEvent()
    event.clipboardData.setData('text/plain', '')
    event.clipboardData.setData('text/html', html)
    clipboard.onPaste(event)
    t.equal(doc.get(['p1', 'content']), '0XXX123456789', 'Content should have been pasted correctly.')
    let annotations = doc.getIndex('annotations').get(['p1', 'content'])
    t.equal(annotations.length, 1, 'There should be one annotation on the property now.')
    let anno = annotations[0]
    t.equal(anno.type, 'link', 'The annotation should be a link.')
    t.end()
  }, forceWindows)
}

function _twoParagraphsTest (t, html, forceWindows) {
  _fixtureTest(t, html, function (doc, clipboard) {
    let event = new ClipboardEvent()
    event.clipboardData.setData('text/plain', '')
    event.clipboardData.setData('text/html', html)
    clipboard.onPaste(event)
    let body = doc.get('body')
    let p1 = body.getChildAt(0)
    t.equal(p1.content, '0AAA', 'First paragraph should be truncated.')
    let p2 = body.getChildAt(1)
    t.equal(p2.content, 'BBB', "Second paragraph should contain 'BBB'.")
    let p3 = body.getChildAt(2)
    t.equal(p3.content, '123456789', 'Remainder of original p1 should go into forth paragraph.')
    t.end()
  }, forceWindows)
}

function _extendedTest (t, html, forceWindows) {
  _emptyFixtureTest(t, html, function (doc, clipboard) {
    let event = new ClipboardEvent()
    event.clipboardData.setData('text/plain', '')
    event.clipboardData.setData('text/html', html)
    clipboard.onPaste(event)
    let body = doc.get('body')
    // First node is a paragraph with strong, emphasis, superscript and subscript annos
    let node1 = body.getChildAt(0)
    t.equal(node1.type, 'paragraph', 'First node should be a paragraph.')
    t.equal(node1.content.length, 121, 'First paragraph should contain 121 symbols.')
    let annotationsNode1 = doc.getIndex('annotations').get([node1.id, 'content']).sort((a, b) => {
      return a.start.offset - b.start.offset
    })
    t.equal(annotationsNode1.length, 4, 'There should be four annotations inside a first paragraph.')
    let annoFirstNode1 = annotationsNode1[0] || {}
    t.equal(annoFirstNode1.type, 'emphasis', 'The annotation should be an emphasis.')
    t.equal(annoFirstNode1.start.offset, 4, 'Emphasis annotation should start from 5th symbol.')
    t.equal(annoFirstNode1.end.offset, 11, 'Emphasis annotation should end at 12th symbol.')
    let annoSecondNode1 = annotationsNode1[1] || {}
    t.equal(annoSecondNode1.type, 'strong', 'The annotation should be a strong.')
    t.equal(annoSecondNode1.start.offset, 18, 'Strong annotation should start from 19th symbol.')
    t.equal(annoSecondNode1.end.offset, 30, 'Strong annotation should end at 31th symbol.')
    let annoThirdNode1 = annotationsNode1[2] || {}
    t.equal(annoThirdNode1.type, 'superscript', 'The annotation should be a superscript.')
    t.equal(annoThirdNode1.start.offset, 41, 'Superscript annotation should start from 42th symbol.')
    t.equal(annoThirdNode1.end.offset, 49, 'Superscript annotation should end at 50th symbol.')
    let annoFourthNode1 = annotationsNode1[3] || {}
    t.equal(annoFourthNode1.type, 'subscript', 'The annotation should be a subscript.')
    t.equal(annoFourthNode1.start.offset, 50, 'Subscript annotation should start from 51th symbol.')
    t.equal(annoFourthNode1.end.offset, 56, 'Subscript annotation should end at 57th symbol.')

    // Second node is a first level heading without annos
    let node2 = body.getChildAt(1)
    t.equal(node2.type, 'heading', 'Second node should be a heading.')
    t.equal(node2.level, 1, 'Second node should be a first level heading.')
    t.equal(node2.content.length, 12, 'Heading should contain 12 symbols.')
    let annotationsNode2 = doc.getIndex('annotations').get([node2.id, 'content'])
    t.equal(annotationsNode2.length, 0, 'There should be no annotations inside a heading.')

    // Third node is a paragraph with overlapping annos
    let node3 = body.getChildAt(2)
    t.equal(node3.type, 'paragraph', 'Third node should be a paragraph.')
    t.equal(node3.content.length, 178, 'Second paragraph should contain 178 symbols.')
    // let annotationsNode3 = doc.getIndex('annotations').get([node3.id, 'content']).sort((a, b) => {
    //   return a.start.offset - b.start.offset
    // })
    // While we are not supporting combined formatting annotations
    // we will run selective tests for selections to ensure that annotations are exist

    // Get annotations for range without annotations
    let path = [node3.id, 'content']
    let compare = function (a, b) {
      if (a.id < b.id) return -1
      if (a.id > b.id) return 1
      return 0
    }
    let annos = doc.getIndex('annotations').get(path, 3, 5)
    t.equal(annos.length, 0, 'There should be no annotations within given range.')

    // Get annotations for range with string, emphasis and superscript annotations
    annos = doc.getIndex('annotations').get(path, 17, 18).sort(compare)
    t.equal(annos.length, 3, 'There should be three annotations within given range.')
    t.isNotNil(find(annos, {type: 'emphasis'}), 'Should contain emphasis annotation.')
    t.isNotNil(find(annos, {type: 'strong'}), 'Should contain strong annotation.')
    t.isNotNil(find(annos, {type: 'superscript'}), 'Should contain superscript annotation.')

    // Get annotations for range with string, emphasis and subscript annotations
    annos = doc.getIndex('annotations').get(path, 22, 23).sort(compare)
    t.isNotNil(find(annos, {type: 'emphasis'}), 'Should contain emphasis annotation.')
    t.isNotNil(find(annos, {type: 'strong'}), 'Should contain strong annotation.')
    t.isNotNil(find(annos, {type: 'subscript'}), 'Should contain subscript annotation.')

    // Get annotations for range with string and emphasis
    annos = doc.getIndex('annotations').get(path, 27, 29).sort(compare)
    t.isNotNil(find(annos, {type: 'emphasis'}), 'Should contain emphasis annotation.')
    t.isNotNil(find(annos, {type: 'strong'}), 'Should contain strong annotation.')

    // t.equal(annotationsNode3.length, 6, "There should be six annotations inside a second paragraph.")
    // let annoFirstNode3 = annotationsNode3[0] || {}
    // t.equal(annoFirstNode3.type, 'strong', "The annotation should be a strong.")
    // t.equal(annoFirstNode3.start.offset, 14, "Strong annotation should start from 15th symbol.")
    // t.equal(annoFirstNode3.end.offset, 25, "Strong annotation should end at 26th symbol.")
    // let annoSecondNode3 = annotationsNode3[1] || {}
    // t.equal(annoSecondNode3.type, 'emphasis', "The annotation should be an emphasis.")
    // t.equal(annoSecondNode3.start.offset, 15, "Emphasis annotation should start from 16th symbol.")
    // t.equal(annoSecondNode3.end.offset, 24, "Emphasis annotation should end at 25th symbol.")
    // let annoThirdNode3 = annotationsNode3[2] || {}
    // t.equal(annoThirdNode3.type, 'superscript', "The annotation should be a superscript.")
    // t.equal(annoThirdNode3.start.offset, 16, "Superscript annotation should start from 17th symbol.")
    // t.equal(annoThirdNode3.end.offset, 19, "Superscript annotation should end at 20th symbol.")
    // let annoFourthNode3 = annotationsNode3[3] || {}
    // t.equal(annoFourthNode3.type, 'subscript', "The annotation should be a subscript.")
    // t.equal(annoFourthNode3.start.offset, 21, "Subscript annotation should start from 22th symbol.")
    // t.equal(annoFourthNode3.end.offset, 23, "Subscript annotation should end at 23th symbol.")
    // let annoFifthNode3 = annotationsNode3[4] || {}
    // t.equal(annoFifthNode3.type, 'emphasis', "The annotation should be an emphasis.")
    // t.equal(annoFifthNode3.start.offset, 26, "Emphasis annotation should start from 27th symbol.")
    // t.equal(annoFifthNode3.end.offset, 30, "Emphasis annotation should end at 31th symbol.")
    // let annoSixthNode3 = annotationsNode3[5] || {}
    // t.equal(annoSixthNode3.type, 'strong', "The annotation should be a strong.")
    // t.equal(annoSixthNode3.start.offset, 27, "Strong annotation should start from 28th symbol.")
    // t.equal(annoSixthNode3.end.offset, 29, "Strong annotation should end at 30th symbol.")
    t.end()
  }, forceWindows)
}
