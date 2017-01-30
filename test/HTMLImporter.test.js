import { module } from 'substance-test'

import DOMElement from '../dom/DefaultDOMElement'
import TestHTMLImporter from './fixture/TestHTMLImporter'

const test = module('HTMLImporter')

var CONTENT = '0123456789'

test("Importing paragraph", function(t) {
  let importer = new TestHTMLImporter()
  var html = '<p data-id="p1">' + CONTENT + '</p>'
  var el = DOMElement.parseHTML(html)
  var node = importer.convertElement(el)
  t.deepEqual(node.toJSON(), {
    id: "p1",
    type: "paragraph",
    content: CONTENT
  }, 'paragraph should have been imported correctly')
  t.end()
})

test("Importing paragraph with strong", function(t) {
  let importer = new TestHTMLImporter()
  var html = '<p data-id="p1">0123<strong data-id="s1">456</strong>789</p>'
  var el = DOMElement.parseHTML(html)
  importer.convertElement(el)
  var doc = importer.generateDocument()
  var p1 = doc.get('p1')
  var s1 = doc.get('s1')
  t.equal(CONTENT, p1.content, 'paragraph should have correct content')
  t.equal('456', s1.getText(), 'annotation should provide correct text')
  t.end()
})

test("Importing h1", function(t) {
  let importer = new TestHTMLImporter()
  var html = '<h1 data-id="h1">' + CONTENT + '</h1>'
  var el = DOMElement.parseHTML(html)
  var node = importer.convertElement(el)
  t.deepEqual(node.toJSON(), {
    id: "h1",
    type: "heading",
    level: 1,
    content: CONTENT
  }, 'heading should have been imported correctly')
  t.end()
})

test("Importing h2", function(t) {
  let importer = new TestHTMLImporter()
  var html = '<h2 data-id="h2">' + CONTENT + '</h2>'
  var el = DOMElement.parseHTML(html)
  var node = importer.convertElement(el)
  t.deepEqual(node.toJSON(), {
    id: "h2",
    type: "heading",
    level: 2,
    content: CONTENT
  }, 'heading should have been imported correctly')
  t.end()
})

test("Importing an unordered list", function(t) {
  let importer = new TestHTMLImporter()
  let html = '<ul data-id="l1"><li>Foo</li><li>Bar</li></ul>'
  let el = DOMElement.parseHTML(html)
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
  let importer = new TestHTMLImporter()
  let html = '<ol data-id="l1"></ol>'
  let el = DOMElement.parseHTML(html)
  let node = importer.convertElement(el)
  t.equal(node.type, 'list', 'Imported node should be a list')
  t.equal(node.id, 'l1', 'id should be correct')
  t.equal(node.ordered, true, 'node should ordered')
  t.end()
})

test("Importing a nested list", function(t) {
  let importer = new TestHTMLImporter()
  let html = '<ul data-id="l1"><li>Foo</li><ul><li>Bla</li><li>Blupp</li></ul><li>Bar</li></ul>'
  let el = DOMElement.parseHTML(html)
  let node = importer.convertElement(el)
  t.equal(node.items.length, 4, 'Imported node should have 4 items')
  let levels = node.getItems().map(item=>item.level)
  t.equal(String(levels), String([1,2,2,1]), 'Node levels should be correct')
  t.end()
})

test("Importing a nested list (bad style)", function(t) {
  let importer = new TestHTMLImporter()
  let html = '<ul data-id="l1"><li>Foo<ul><li>Bla</li><li>Blupp</li></ul></li><li>Bar</li></ul>'
  let el = DOMElement.parseHTML(html)
  let node = importer.convertElement(el)
  t.equal(node.items.length, 4, 'Imported node should have 4 items')
  let levels = node.getItems().map(item=>item.level)
  t.equal(String(levels), String([1,2,2,1]), 'Node levels should be correct')
  t.end()
})
