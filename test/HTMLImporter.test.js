import { module } from 'substance-test'
import inBrowser from '../util/inBrowser'
import DefaultDOMElement from '../dom/DefaultDOMElement'
import checkValues from './fixture/checkValues'
import getTestConfig from './fixture/getTestConfig'

const CONTENT = '0123456789'


HTMLImporterTests()

if (inBrowser) {
  HTMLImporterTests('memory')
}

function HTMLImporterTests(memory) {

  const test = module('HTMLImporter' + ( memory ? ' [memory]' : ''), {
    before: () => {
      if (memory) DefaultDOMElement._useXNode()
    },
    after: () => {
      DefaultDOMElement._reset()
    }
  })

  test("Importing paragraph", function(t) {
    let importer = _setupImporter({ 'stand-alone': true })
    let html = '<p data-id="p1">' + CONTENT + '</p>'
    let el = DefaultDOMElement.parseHTML(html)
    let node = importer.convertElement(el)
    checkValues(t, node, {
      id: "p1",
      type: "paragraph",
      content: CONTENT
    }, 'paragraph should have been imported correctly')
    t.end()
  })

  test("Importing paragraph with strong", function(t) {
    let importer = _setupImporter({ 'stand-alone': true })
    let html = '<p data-id="p1">0123<strong data-id="s1">456</strong>789</p>'
    let el = DefaultDOMElement.parseHTML(html)
    let p1 = importer.convertElement(el)
    let doc = p1.getDocument()
    let s1 = doc.get('s1')
    t.equal(p1.content, CONTENT, 'paragraph should have correct content')
    t.equal(s1.getText(), '456', 'annotation should provide correct text')
    t.end()
  })

  test("Importing h1", function(t) {
    let importer = _setupImporter({ 'stand-alone': true })
    let html = '<h1 data-id="h1">' + CONTENT + '</h1>'
    let el = DefaultDOMElement.parseHTML(html)
    let node = importer.convertElement(el)
    checkValues(t, node, {
      id: "h1",
      type: "heading",
      level: 1,
      content: CONTENT
    }, 'heading should have been imported correctly')
    t.end()
  })

  test("Importing h2", function(t) {
    let importer = _setupImporter({ 'stand-alone': true })
    let html = '<h2 data-id="h2">' + CONTENT + '</h2>'
    let el = DefaultDOMElement.parseHTML(html)
    let node = importer.convertElement(el)
    checkValues(t, node, {
      id: "h2",
      type: "heading",
      level: 2,
      content: CONTENT
    }, 'heading should have been imported correctly')
    t.end()
  })

  test("Importing an unordered list", function(t) {
    let importer = _setupImporter({ 'stand-alone': true })
    let html = '<ul data-id="l1"><li>Foo</li><li>Bar</li></ul>'
    let el = DefaultDOMElement.parseHTML(html)
    let node = importer.convertElement(el)
    t.equal(node.type, 'list', 'Imported node should be a list')
    t.equal(node.id, 'l1', 'id should be correct')
    t.equal(node.ordered, false, 'node should unordered')
    t.equal(node.items.length, 2, 'it should have 2 items')
    let li1 = node.getItemAt(0)
    let li2 = node.getItemAt(1)
    t.equal(li1.getText(), 'Foo', 'First item should have correct text')
    t.equal(li2.getText(), 'Bar', 'Second item should have correct text')
    t.end()
  })

  test("Importing an ordered list", function(t) {
    let importer = _setupImporter({ 'stand-alone': true })
    let html = '<ol data-id="l1"></ol>'
    let el = DefaultDOMElement.parseHTML(html)
    let node = importer.convertElement(el)
    t.equal(node.type, 'list', 'Imported node should be a list')
    t.equal(node.id, 'l1', 'id should be correct')
    t.equal(node.ordered, true, 'node should ordered')
    t.end()
  })

  test("Importing a nested list", function(t) {
    let importer = _setupImporter({ 'stand-alone': true })
    let html = '<ul data-id="l1"><li>Foo</li><ul><li>Bla</li><li>Blupp</li></ul><li>Bar</li></ul>'
    let el = DefaultDOMElement.parseHTML(html)
    let node = importer.convertElement(el)
    t.equal(node.items.length, 4, 'Imported node should have 4 items')
    let levels = node.getItems().map(item=>item.level)
    let content = node.getItems().map(item=>item.content)
    t.equal(String(levels), String([1,2,2,1]), 'Node levels should be correct')
    t.equal(String(content), String(['Foo','Bla','Blupp','Bar']), 'Items should have correct content')
    t.end()
  })

  test("Importing a nested list (bad style)", function(t) {
    let importer = _setupImporter({ 'stand-alone': true })
    let html = '<ul data-id="l1"><li>Foo<ul><li>Bla</li><li>Blupp</li></ul></li><li>Bar</li></ul>'
    let el = DefaultDOMElement.parseHTML(html)
    let node = importer.convertElement(el)
    t.equal(node.items.length, 4, 'Imported node should have 4 items')
    let levels = node.getItems().map(item=>item.level)
    let content = node.getItems().map(item=>item.content)
    t.equal(String(levels), String([1,2,2,1]), 'Node levels should be correct')
    t.equal(String(content), String(['Foo','Bla','Blupp','Bar']), 'Items should have correct content')
    t.end()
  })

}

function _setupImporter(options = {}) {
  let config = getTestConfig()
  let importer = config.createImporter('html', {}, options)
  return importer
}
