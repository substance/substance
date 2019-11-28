import { test as _test } from 'substance-test'
import { DefaultDOMElement, platform, find, documentHelpers, Clipboard } from 'substance'
import setupEditor from './shared/setupEditor'
import { ClipboardEventData } from './shared/testHelpers'

import simple from './clipboard/simple'
import BrowserLinuxPLainTextFixture from './clipboard/browser-linux-plain-text'
import BrowserLinuxAnnotatedTextFixture from './clipboard/browser-linux-annotated-text'
import BrowserLinuxTwoParagraphsFixture from './clipboard/browser-linux-two-paragraphs'
import BrowserWindowsPlainTextFixture from './clipboard/browser-windows-plain-text'
import BrowserWindowsAnnotatedTextFixture from './clipboard/browser-windows-annotated-text'
import BrowserWindowsTwoParagraphsFixture from './clipboard/browser-windows-two-paragraphs'
import BrowserLinuxFirefoxPlainTextFixture from './clipboard/browser-linux-firefox-plain-text'
import BrowserLinuxFirefoxAnnotatedTextFixture from './clipboard/browser-linux-firefox-annotated-text'
import BrowserLinuxFirefoxTwoParagraphsFixture from './clipboard/browser-linux-firefox-two-paragraphs'
import BrowserLinuxFirefoxWholePageFixture from './clipboard/browser-linux-firefox-whole-page'
import BrowserOSXFirefoxPlainTextFixture from './clipboard/browser-osx-firefox-plain-text'
import BrowserOSXFirefoxAnnotatedTextFixture from './clipboard/browser-osx-firefox-annotated-text'
import BrowserOSXFirefoxTwoParagraphsFixture from './clipboard/browser-osx-firefox-two-paragraphs'
import BrowserWindowsFirefoxPlainTextFixture from './clipboard/browser-windows-firefox-plain-text'
import BrowserWindowsFirefoxAnnotatedTextFixture from './clipboard/browser-windows-firefox-annotated-text'
import BrowserWindowsFirefoxTwoParagraphsFixture from './clipboard/browser-windows-firefox-two-paragraphs'
import BrowserWindowsEdgePlainTextFixture from './clipboard/browser-windows-edge-plain-text'
import BrowserWindowsEdgeAnnotatedTextFixture from './clipboard/browser-windows-edge-annotated-text'
import BrowserWindowsEdgeTwoParagraphsFixture from './clipboard/browser-windows-edge-two-paragraphs'
import GDocsOSXLinuxChromePlainTextFixture from './clipboard/google-docs-osx-linux-chrome-plain-text'
import GDocsOSXLinuxChromeAnnotatedTextFixture from './clipboard/google-docs-osx-linux-chrome-annotated-text'
import GDocsOSXLinuxChromeTwoParagraphsFixture from './clipboard/google-docs-osx-linux-chrome-two-paragraphs'
import GDocsOSXLinuxChromeExtendedFixture from './clipboard/google-docs-osx-linux-chrome-extended'
import GDocsLinuxFirefoxPlainTextFixture from './clipboard/google-docs-linux-firefox-plain-text'
import GDocsLinuxFirefoxAnnotatedTextFixture from './clipboard/google-docs-linux-firefox-annotated-text'
import GDocsOSXFirefoxPlainTextFixture from './clipboard/google-docs-osx-firefox-plain-text'
import LibreOfficeOSXPlainTextFixture from './clipboard/libre-office-osx-linux-plain-text'
import LibreOfficeOSXAnnotatedTextFixture from './clipboard/libre-office-osx-linux-annotated-text'
import LibreOfficeOSXTwoParagraphsFixture from './clipboard/libre-office-osx-linux-two-paragraphs'
import LibreOfficeOSXExtendedFixture from './clipboard/libre-office-osx-linux-extended'
import MSW11OSXPlainTextFixture from './clipboard/word-11-osx-plain-text'
import MSW11OSXAnnotatedTextFixture from './clipboard/word-11-osx-annotated-text'
import MSW11OSXTwoParagraphsFixture from './clipboard/word-11-osx-two-paragraphs'
import MSW11OSXExtendedFixture from './clipboard/word-11-osx-extended'

const PARAGRAPH_TYPE = 'paragraph'
const HEADING_TYPE = 'heading'
const LINK_TYPE = 'link'
const EMPHASIS_TYPE = 'emphasis'
const STRONG_TYPE = 'strong'
const SUPERSCRIPT_TYPE = 'superscript'
const SUBSCRIPT_TYPE = 'subscript'
const CODEBLOCK_TYPE = 'preformat'
const BODY_CONTENT_PATH = ['body', 'nodes']

ClipboardTests()

if (platform.inBrowser) {
  ClipboardTests('memory')
}

function ClipboardTests (memory) {
  function test (title, fn) {
    _test('Clipboard' + (memory ? ' [memory]' : '') + ': ' + title, fn, {
      before () {
        if (memory) platform.values.inBrowser = false
      },
      after () {
        platform._reset()
      }
    })
  }

  test('Copying HTML, and plain text', t => {
    const { editorSession, clipboard, context } = _setup(t, simple)
    editorSession.setSelection({ type: 'property', path: ['p1', 'content'], startOffset: 0, endOffset: 5 })
    const clipboardData = _createClipboardData()
    clipboard.copy(clipboardData, context)
    t.notNil(clipboardData.data['text/plain'], 'Clipboard should contain plain text data.')
    t.notNil(clipboardData.data['text/html'], 'Clipboard should contain HTML data.')
    const htmlDoc = DefaultDOMElement.parseHTML(clipboardData.data['text/html'])
    const body = htmlDoc.find('body')
    t.notNil(body, 'The copied HTML should always be a full HTML document string, containing a body element.')
    t.end()
  })

  test('Copying a property selection', t => {
    const { editorSession, clipboard, context } = _setup(t, simple)
    editorSession.setSelection({ type: 'property', path: ['p1', 'content'], startOffset: 0, endOffset: 5 })
    const TEXT = '01234'
    const clipboardData = _createClipboardData()
    clipboard.copy(clipboardData, context)
    t.equal(clipboardData.data['text/plain'], TEXT, 'Plain text should be correct.')

    const htmlDoc = DefaultDOMElement.parseHTML(clipboardData.data['text/html'])
    const body = htmlDoc.find('body')
    t.equal(body.text(), TEXT, 'HTML text should be correct.')
    t.end()
  })

  test('Copying a container selection', t => {
    const { editorSession, clipboard, context } = _setup(t, simple)
    editorSession.setSelection({
      type: 'container',
      containerPath: BODY_CONTENT_PATH,
      startPath: ['p1', 'content'],
      startOffset: 1,
      endPath: ['p3', 'content'],
      endOffset: 5
    })
    const TEXT = [
      '123456789',
      '0123456789',
      '01234'
    ]
    const LINE_SEP = '\n\n'

    const clipboardData = _createClipboardData()
    clipboard.copy(clipboardData, context)
    t.equal(clipboardData.data['text/plain'], TEXT.join(LINE_SEP), 'Plain text should be correct.')

    const htmlDoc = DefaultDOMElement.parseHTML(clipboardData.data['text/html'])
    const elements = htmlDoc.find('body').getChildren()
    t.equal(elements.length, 3, 'HTML should consist of three elements.')
    const p1 = elements[0]
    t.equal(p1.attr('data-id'), 'p1', 'First element should have correct data-id.')
    t.equal(p1.text(), TEXT[0], 'First element should have correct text content.')
    const p2 = elements[1]
    t.equal(p2.attr('data-id'), 'p2', 'Second element should have correct data-id.')
    t.equal(p2.text(), TEXT[1], 'Second element should have correct text content.')
    const p3 = elements[2]
    t.equal(p3.attr('data-id'), 'p3', 'Third element should have correct data-id.')
    t.equal(p3.text(), TEXT[2], 'Third element should have correct text content.')
    t.end()
  })

  test("Pasting text into ContainerEditor using 'text/plain'.", t => {
    const { editorSession, clipboard, doc, context } = _setup(t, simple)
    editorSession.setSelection({
      type: 'property',
      path: ['p1', 'content'],
      startOffset: 1,
      containerPath: BODY_CONTENT_PATH
    })
    const clipboardData = _createClipboardData()
    clipboardData.setData('text/plain', 'XXX')
    clipboard.paste(clipboardData, context)
    t.equal(doc.get(['p1', 'content']), '0XXX123456789', 'Plain text should be correct.')
    t.end()
  })

  test('Pasting without any data given.', t => {
    const { editorSession, clipboard, doc, context } = _setup(t, simple)
    editorSession.setSelection({
      type: 'property',
      path: ['p1', 'content'],
      startOffset: 1,
      containerPath: BODY_CONTENT_PATH
    })
    const clipboardData = _createClipboardData()
    clipboard.paste(clipboardData, context)
    t.equal(doc.get(['p1', 'content']), '0123456789', 'Text should be still the same.')
    t.end()
  })

  test("Pasting text into ContainerEditor using 'text/html'.", t => {
    const { editorSession, clipboard, doc, context } = _setup(t, simple)
    editorSession.setSelection({
      type: 'property',
      path: ['p1', 'content'],
      startOffset: 1,
      containerPath: BODY_CONTENT_PATH
    })
    const TEXT = 'XXX'
    const clipboardData = _createClipboardData()
    clipboardData.setData('text/plain', TEXT)
    clipboardData.setData('text/html', TEXT)
    clipboard.paste(clipboardData, context)
    t.equal(doc.get(['p1', 'content']), '0XXX123456789', 'Plain text should be correct.')
    t.end()
  })

  // this test revealed #700: the problem was that in source code there where
  // `"` and `'` characters which did not survive the way through HTML correctly
  test('Copy and Pasting source code.', t => {
    const { editorSession, clipboard, doc, context } = _setup(t, simple)
    const cb = doc.create({
      type: CODEBLOCK_TYPE,
      id: 'cb1',
      content: [
        'function hello_world() {',
        "  alert('Hello World!');",
        '}'
      ].join('\n')
    })
    documentHelpers.insertAt(doc, BODY_CONTENT_PATH, doc.get('p1').getPosition() + 1, cb.id)
    editorSession.setSelection(doc.createSelection({
      type: 'container',
      startPath: ['p1', 'content'],
      startOffset: 1,
      endPath: ['p2', 'content'],
      endOffset: 1,
      containerPath: BODY_CONTENT_PATH
    }))
    const clipboardData = _createClipboardData()
    clipboard.cut(clipboardData, context)
    let cb1 = doc.get('cb1')
    t.isNil(cb1, 'Codeblock should have been cutted.')
    clipboard.paste(clipboardData, context)
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

  // TODO: bring back an fall-back converter for unsupported content
  test('Browser - Firefox (Linux) - Whole Page', t => {
    const html = BrowserLinuxFirefoxWholePageFixture
    _fixtureTest(t, html, (doc, clipboard, context) => {
      const clipboardData = _createClipboardData()
      clipboardData.setData('text/plain', 'XXX')
      clipboardData.setData('text/html', html)
      clipboard.paste(clipboardData, context)
      // make sure HTML paste succeeded, by checking against the result of plain text insertion
      t.notOk(doc.get('p1').getText() === '0XXX123456789', 'HTML conversion and paste should have been successful (not fall back to plain-text).')
      t.ok(doc.get('body').getLength() > 10, 'There should be a lot of paragraphs')
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

function _fixtureTest (t, html, impl, forceWindows) {
  const { editorSession, clipboard, doc, context } = _setup(t, simple)
  platform.values.isWindows = Boolean(forceWindows)
  editorSession.setSelection({
    type: 'property',
    path: ['p1', 'content'],
    startOffset: 1,
    containerPath: BODY_CONTENT_PATH
  })
  try {
    impl(doc, clipboard, context)
  } finally {
    platform._reset()
  }
}

function _emptyFixtureTest (t, html, impl, forceWindows) {
  const { context, editorSession, clipboard, doc } = _setup(t, _emptyParagraphSeed)
  if (forceWindows) {
    // NOTE: faking 'Windows' mode in importer so that
    // the correct implementation will be used
    clipboard.htmlImporter._isWindows = true
  }
  editorSession.setSelection({
    type: 'property',
    path: ['p1', 'content'],
    startOffset: 0,
    containerPath: BODY_CONTENT_PATH
  })
  impl(doc, clipboard, context)
}

function _plainTextTest (t, html, forceWindows) {
  _fixtureTest(t, html, (doc, clipboard, context) => {
    const clipboardData = _createClipboardData()
    clipboardData.setData('text/plain', '')
    clipboardData.setData('text/html', html)
    clipboard.paste(clipboardData, context)
    t.equal(doc.get(['p1', 'content']), '0XXX123456789', 'Content should have been pasted correctly.')
    t.end()
  }, forceWindows)
}

function _annotatedTextTest (t, html, forceWindows) {
  _fixtureTest(t, html, (doc, clipboard, context) => {
    const clipboardData = _createClipboardData()
    clipboardData.setData('text/plain', '')
    clipboardData.setData('text/html', html)
    clipboard.paste(clipboardData, context)
    t.equal(doc.get(['p1', 'content']), '0XXX123456789', 'Content should have been pasted correctly.')
    const annotations = doc.getIndex('annotations').get(['p1', 'content'])
    t.equal(annotations.length, 1, 'There should be one annotation on the property now.')
    const anno = annotations[0]
    t.equal(anno.type, LINK_TYPE, 'The annotation should be a link.')
    t.end()
  }, forceWindows)
}

function _twoParagraphsTest (t, html, forceWindows) {
  _fixtureTest(t, html, (doc, clipboard, context) => {
    const clipboardData = _createClipboardData()
    clipboardData.setData('text/plain', '')
    clipboardData.setData('text/html', html)
    clipboard.paste(clipboardData, context)
    const body = doc.get('body')
    const [p1, p2, p3] = body.getNodes()
    t.equal(p1.content, '0AAA', 'First paragraph should be truncated.')
    t.equal(p2.content, 'BBB', "Second paragraph should contain 'BBB'.")
    t.equal(p3.content, '123456789', 'Remainder of original p1 should go into forth paragraph.')
    t.end()
  }, forceWindows)
}

function _extendedTest (t, html, forceWindows) {
  _emptyFixtureTest(t, html, (doc, clipboard, context) => {
    const clipboardData = _createClipboardData()
    clipboardData.setData('text/plain', '')
    clipboardData.setData('text/html', html)
    clipboard.paste(clipboardData, context)
    // First node is a paragraph with strong, emphasis, superscript and subscript annos
    const body = doc.get('body')
    const [node1, node2, node3] = body.getNodes()
    t.equal(node1.type, PARAGRAPH_TYPE, 'First node should be a paragraph.')
    t.equal(node1.content.length, 121, 'First paragraph should contain 121 symbols.')
    const annotationsNode1 = doc.getIndex('annotations').get([node1.id, 'content']).sort((a, b) => {
      return a.start.offset - b.start.offset
    })
    t.equal(annotationsNode1.length, 4, 'There should be four annotations inside a first paragraph.')
    const annoFirstNode1 = annotationsNode1[0] || {}
    t.equal(annoFirstNode1.type, EMPHASIS_TYPE, 'The annotation should be an emphasis.')
    t.equal(annoFirstNode1.start.offset, 4, 'Emphasis annotation should start from 5th symbol.')
    t.equal(annoFirstNode1.end.offset, 11, 'Emphasis annotation should end at 12th symbol.')
    const annoSecondNode1 = annotationsNode1[1] || {}
    t.equal(annoSecondNode1.type, STRONG_TYPE, 'The annotation should be a strong.')
    t.equal(annoSecondNode1.start.offset, 18, 'Strong annotation should start from 19th symbol.')
    t.equal(annoSecondNode1.end.offset, 30, 'Strong annotation should end at 31th symbol.')
    const annoThirdNode1 = annotationsNode1[2] || {}
    t.equal(annoThirdNode1.type, SUPERSCRIPT_TYPE, 'The annotation should be a superscript.')
    t.equal(annoThirdNode1.start.offset, 41, 'Superscript annotation should start from 42th symbol.')
    t.equal(annoThirdNode1.end.offset, 49, 'Superscript annotation should end at 50th symbol.')
    const annoFourthNode1 = annotationsNode1[3] || {}
    t.equal(annoFourthNode1.type, SUBSCRIPT_TYPE, 'The annotation should be a subscript.')
    t.equal(annoFourthNode1.start.offset, 50, 'Subscript annotation should start from 51th symbol.')
    t.equal(annoFourthNode1.end.offset, 56, 'Subscript annotation should end at 57th symbol.')

    // Second node is a first level heading without annos
    t.equal(node2.type, HEADING_TYPE, 'Second node should be a heading.')
    t.equal(node2.level, 1, 'Second node should be a first level heading.')
    t.equal(node2.content.length, 12, 'Heading should contain 12 symbols.')
    const annotationsNode2 = doc.getIndex('annotations').get([node2.id, 'content'])
    t.equal(annotationsNode2.length, 0, 'There should be no annotations inside a heading.')

    // Third node is a paragraph with overlapping annos
    t.equal(node3.type, PARAGRAPH_TYPE, 'Third node should be a paragraph.')
    t.equal(node3.content.length, 178, 'Second paragraph should contain 178 symbols.')
    // let annotationsNode3 = doc.getIndex('annotations').get([node3.id, 'content']).sort((a, b) => {
    //   return a.start.offset - b.start.offset
    // })
    // While we are not supporting combined formatting annotations
    // we will run selective tests for selections to ensure that annotations are exist

    // Get annotations for range without annotations
    const path = [node3.id, 'content']
    const compare = function (a, b) {
      if (a.id < b.id) return -1
      if (a.id > b.id) return 1
      return 0
    }
    let annos = doc.getIndex('annotations').get(path, 3, 5)
    t.equal(annos.length, 0, 'There should be no annotations within given range.')

    // Get annotations for range with string, emphasis and superscript annotations
    annos = doc.getIndex('annotations').get(path, 17, 18).sort(compare)
    t.equal(annos.length, 3, 'There should be three annotations within given range.')
    t.notNil(find(annos, { type: EMPHASIS_TYPE }), 'Should contain emphasis annotation.')
    t.notNil(find(annos, { type: STRONG_TYPE }), 'Should contain strong annotation.')
    t.notNil(find(annos, { type: SUPERSCRIPT_TYPE }), 'Should contain superscript annotation.')

    // Get annotations for range with string, emphasis and subscript annotations
    annos = doc.getIndex('annotations').get(path, 22, 23).sort(compare)
    t.notNil(find(annos, { type: EMPHASIS_TYPE }), 'Should contain emphasis annotation.')
    t.notNil(find(annos, { type: STRONG_TYPE }), 'Should contain strong annotation.')
    t.notNil(find(annos, { type: SUBSCRIPT_TYPE }), 'Should contain subscript annotation.')

    // Get annotations for range with string and emphasis
    annos = doc.getIndex('annotations').get(path, 27, 29).sort(compare)
    t.notNil(find(annos, { type: EMPHASIS_TYPE }), 'Should contain emphasis annotation.')
    t.notNil(find(annos, { type: STRONG_TYPE }), 'Should contain strong annotation.')

    t.end()
  }, forceWindows)
}

function _createClipboardData () {
  return new ClipboardEventData()
}

function _setup (t, seed) {
  const { context, editorSession, doc } = setupEditor(t, seed)
  const clipboard = new Clipboard()
  return { context, editorSession, doc, clipboard }
}

function _emptyParagraphSeed (tx) {
  tx.create({
    type: PARAGRAPH_TYPE,
    id: 'p1',
    content: ''
  })
  documentHelpers.append(tx, BODY_CONTENT_PATH, 'p1')
}
