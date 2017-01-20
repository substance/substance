import { module } from 'substance-test'

import inBrowser from '../../util/inBrowser'
import DefaultDOMElement from '../../dom/DefaultDOMElement'
import XNode from '../../dom/XNode'
import TestHTMLExporter from '../model/TestHTMLExporter'
import TestArticle from '../model/TestArticle'
import createTestArticle from '../fixtures/createTestArticle'
import simple from '../fixtures/simple'

const CONTENT = '0123456789'

htmlExporterTests()

if (inBrowser) {
  htmlExporterTests('memory')
}

function htmlExporterTests(memory) {

  const test = module('model/HTMLExporter' + ( memory ? ' [memory]' : ''))
    .withOptions({
      before: function(t) {
        t.elementFactory = memory ? XNode.createDocument('html') : DefaultDOMElement.createDocument('html')
      }
    })

  test("Exporting paragraph", function(t) {
    let { doc, exporter } = setup(t)
    let p1 = doc.create({ type: 'paragraph', id: 'p1', content: CONTENT })
    let el = exporter.convertNode(p1)
    let actual = el.outerHTML
    let expected = '<p data-id="p1">' + CONTENT + '</p>'
    t.equal(actual, expected)
    t.end()
  })

  test("Exporting paragraph with strong", function(t) {
    let { doc, exporter } = setup(t)
    let p1 = doc.create({ type: 'paragraph', id: 'p1', content: CONTENT })
    doc.create({ type: 'strong', id: 's1', path: ['p1', 'content'], startOffset: 4, endOffset: 7})
    let el = exporter.convertNode(p1)
    let actual = el.outerHTML
    let expected = '<p data-id="p1">0123<strong data-id="s1">456</strong>789</p>'
    t.equal(actual, expected)
    t.end()
  })

  test("Exporting h1", function(t) {
    let { doc, exporter } = setup(t)
    let h1 = doc.create({ type: 'heading', id: 'h1', level: 1, content: CONTENT })
    let el = exporter.convertNode(h1)
    let actual = el.outerHTML
    let expected = '<h1 data-id="h1">' + CONTENT + '</h1>'
    t.equal(actual, expected)
    t.end()
  })

  test("Exporting h2", function(t) {
    let { doc, exporter } = setup(t)
    let h2 = doc.create({ type: 'heading', id: 'h2', level: 2, content: CONTENT })
    let el = exporter.convertNode(h2)
    let actual = el.outerHTML
    let expected = '<h2 data-id="h2">' + CONTENT + '</h2>'
    t.equal(actual, expected)
    t.end()
  })

  test("Exporting simple document", function(t) {
    let { doc, exporter } = setup(t, simple)
    let el = exporter.exportDocument(doc)
    let actual = el.html()
    let expected = [
      '<p data-id="p1">' + CONTENT + '</p>',
      '<p data-id="p2">' + CONTENT + '</p>',
      '<p data-id="p3">' + CONTENT + '</p>',
      '<p data-id="p4">' + CONTENT + '</p>'
    ].join('')
    t.equal(actual, expected)
    t.end()
  })

  test("Exporting a link", function(t) {
    let { doc, exporter } = setup(t)
    let p1 = doc.create({ type: 'paragraph', id: 'p1', content: CONTENT })
    doc.create({ type: 'link', id: 'l1', path: ['p1', 'content'], startOffset: 4, endOffset: 7, url: 'foo', title: 'bar' })
    let el = exporter.convertNode(p1)
    let childNodes = el.getChildNodes()
    t.equal(childNodes.length, 3)
    t.equal(childNodes[0].textContent, "0123")
    t.equal(childNodes[1].textContent, "456")
    t.equal(childNodes[2].textContent, "789")
    let a = childNodes[1]
    t.equal(a.attr('data-id'), 'l1')
    t.equal(a.attr('href'), 'foo')
    t.equal(a.attr('title'), 'bar')
    t.end()
  })

  function setup(t, fixture) {
    let exporter = new TestHTMLExporter({ elementFactory: t.elementFactory })
    let doc
    if (fixture) {
      doc = createTestArticle(fixture)
    } else {
      doc = new TestArticle()
    }
    return { exporter, doc }
  }

}
