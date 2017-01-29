import { module } from 'substance-test'

import TestHTMLImporter from '../model/TestHTMLImporter'
import DOMElement from '../../dom/DefaultDOMElement'

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
