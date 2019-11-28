import { test as substanceTest } from 'substance-test'
import { DefaultDOMElement, platform } from 'substance'
import checkValues from './shared/checkValues'
import getTestConfig from './shared/getTestConfig'
import createTestArticle from './shared/createTestArticle'

const CONTENT = '0123456789'

HTMLImporterTests()

if (platform.inBrowser) {
  HTMLImporterTests('memory')
}

function HTMLImporterTests (memory) {
  const LABEL = 'HTMLImporter' + (memory ? ' [memory]' : '')
  const test = (title, fn) => substanceTest(`${LABEL}: ${title}`, t => {
    // before
    if (memory) platform.values.inBrowser = false
    try {
      fn(t)
    } finally {
      // after
      platform._reset()
    }
  })

  test('Importing paragraph', function (t) {
    const importer = _setupImporter({ 'stand-alone': true })
    const html = '<p data-id="p1">' + CONTENT + '</p>'
    const el = DefaultDOMElement.parseSnippet(html, 'html')
    const node = importer.convertElement(el)
    checkValues(t, node, {
      id: 'p1',
      type: 'paragraph',
      content: CONTENT
    }, 'paragraph should have been imported correctly')
    t.end()
  })

  test('Importing paragraph with strong', function (t) {
    const importer = _setupImporter({ 'stand-alone': true })
    const html = '<p data-id="p1">0123<strong data-id="s1">456</strong>789</p>'
    const el = DefaultDOMElement.parseSnippet(html, 'html')
    const p1 = importer.convertElement(el)
    const doc = p1.getDocument()
    const s1 = doc.get('s1')
    t.equal(p1.content, CONTENT, 'paragraph should have correct content')
    t.equal(s1.getText(), '456', 'annotation should provide correct text')
    t.end()
  })

  test('Importing h1', function (t) {
    const importer = _setupImporter({ 'stand-alone': true })
    const html = '<h1 data-id="h1">' + CONTENT + '</h1>'
    const el = DefaultDOMElement.parseSnippet(html, 'html')
    const node = importer.convertElement(el)
    checkValues(t, node, {
      id: 'h1',
      type: 'heading',
      level: 1,
      content: CONTENT
    }, 'heading should have been imported correctly')
    t.end()
  })

  test('Importing h2', function (t) {
    const importer = _setupImporter({ 'stand-alone': true })
    const html = '<h2 data-id="h2">' + CONTENT + '</h2>'
    const el = DefaultDOMElement.parseSnippet(html, 'html')
    const node = importer.convertElement(el)
    checkValues(t, node, {
      id: 'h2',
      type: 'heading',
      level: 2,
      content: CONTENT
    }, 'heading should have been imported correctly')
    t.end()
  })

  test('Importing an unordered list', function (t) {
    const importer = _setupImporter({ 'stand-alone': true })
    const html = '<ul data-id="l1"><li>Foo</li><li>Bar</li></ul>'
    const el = DefaultDOMElement.parseSnippet(html, 'html')
    const node = importer.convertElement(el)
    t.equal(node.type, 'list', 'Imported node should be a list')
    t.equal(node.id, 'l1', 'id should be correct')
    t.equal(node.getListType(1), 'bullet', 'node should unordered')
    t.equal(node.items.length, 2, 'it should have 2 items')
    const li1 = node.getItemAt(0)
    const li2 = node.getItemAt(1)
    t.equal(li1.getText(), 'Foo', 'First item should have correct text')
    t.equal(li2.getText(), 'Bar', 'Second item should have correct text')
    t.end()
  })

  test('Importing an ordered list', function (t) {
    const importer = _setupImporter({ 'stand-alone': true })
    const html = '<ol data-id="l1"></ol>'
    const el = DefaultDOMElement.parseSnippet(html, 'html')
    const node = importer.convertElement(el)
    t.equal(node.type, 'list', 'Imported node should be a list')
    t.equal(node.id, 'l1', 'id should be correct')
    t.equal(node.getListType(1), 'order', 'node should be ordered')
    t.end()
  })

  test('Importing a nested list', function (t) {
    const importer = _setupImporter({ 'stand-alone': true })
    const html = '<ul data-id="l1"><li>Foo</li><ul><li>Bla</li><li>Blupp</li></ul><li>Bar</li></ul>'
    const el = DefaultDOMElement.parseSnippet(html, 'html')
    const node = importer.convertElement(el)
    t.equal(node.items.length, 4, 'Imported node should have 4 items')
    const levels = node.getItems().map(item => item.level)
    const content = node.getItems().map(item => item.content)
    t.equal(String(levels), String([1, 2, 2, 1]), 'Node levels should be correct')
    t.equal(String(content), String(['Foo', 'Bla', 'Blupp', 'Bar']), 'Items should have correct content')
    t.end()
  })

  test('Importing a nested list (bad style)', function (t) {
    const importer = _setupImporter({ 'stand-alone': true })
    const html = '<ul data-id="l1"><li>Foo<ul><li>Bla</li><li>Blupp</li></ul></li><li>Bar</li></ul>'
    const el = DefaultDOMElement.parseSnippet(html, 'html')
    const node = importer.convertElement(el)
    t.equal(node.items.length, 4, 'Imported node should have 4 items')
    const levels = node.getItems().map(item => item.level)
    const content = node.getItems().map(item => item.content)
    t.equal(String(levels), String([1, 2, 2, 1]), 'Node levels should be correct')
    t.equal(String(content), String(['Foo', 'Bla', 'Blupp', 'Bar']), 'Items should have correct content')
    t.end()
  })
}

function _setupImporter (options = {}) {
  const config = getTestConfig()
  const doc = createTestArticle()
  const importer = config.createImporter('html', doc, options)
  return importer
}
