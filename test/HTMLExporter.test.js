import { module } from 'substance-test'

import inBrowser from '../util/inBrowser'
import DefaultDOMElement from '../dom/DefaultDOMElement'
import XNode from '../dom/XNode'
import createTestArticle from './fixture/createTestArticle'
import simple from './fixture/simple'
import getTestConfig from './fixture/getTestConfig'

const CONTENT = '0123456789'

htmlExporterTests()

if (inBrowser) {
  htmlExporterTests('memory')
}

function htmlExporterTests(memory) {

  const test = module('HTMLExporter' + ( memory ? ' [memory]' : ''), {
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
    t.equal(actual, expected, 'Exported HTML should be correct')
    t.end()
  })

  test("Exporting paragraph with strong", function(t) {
    let { doc, exporter } = setup(t)
    let p1 = doc.create({ type: 'paragraph', id: 'p1', content: CONTENT })
    doc.create({
      type: 'strong',
      id: 's1',
      start: {
        path: ['p1', 'content'],
        offset: 4
      },
      end: {
        offset: 7
      }
    })
    let el = exporter.convertNode(p1)
    let actual = el.outerHTML
    let expected = '<p data-id="p1">0123<strong data-id="s1">456</strong>789</p>'
    t.equal(actual, expected, 'Exported HTML should be correct')
    t.end()
  })

  test("Exporting h1", function(t) {
    let { doc, exporter } = setup(t)
    let h1 = doc.create({ type: 'heading', id: 'h1', level: 1, content: CONTENT })
    let el = exporter.convertNode(h1)
    let actual = el.outerHTML
    let expected = '<h1 data-id="h1">' + CONTENT + '</h1>'
    t.equal(actual, expected, 'Exported HTML should be correct')
    t.end()
  })

  test("Exporting h2", function(t) {
    let { doc, exporter } = setup(t)
    let h2 = doc.create({ type: 'heading', id: 'h2', level: 2, content: CONTENT })
    let el = exporter.convertNode(h2)
    let actual = el.outerHTML
    let expected = '<h2 data-id="h2">' + CONTENT + '</h2>'
    t.equal(actual, expected, 'Exported HTML should be correct')
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
    t.equal(actual, expected, 'Exported HTML should be correct')
    t.end()
  })

  test("Exporting a link", function(t) {
    let { doc, exporter } = setup(t)
    let p1 = doc.create({ type: 'paragraph', id: 'p1', content: CONTENT })
    doc.create({
      type: 'link',
      id: 'l1',
      start: {
        path: ['p1', 'content'],
        offset: 4,
      },
      end: {
        offset: 7
      },
      url: 'foo',
      title: 'bar'
    })
    let el = exporter.convertNode(p1)
    let childNodes = el.getChildNodes()
    t.equal(childNodes.length, 3, 'Exported paragraph should have 3 child nodes')
    t.equal(childNodes[0].textContent, "0123", '.. 1. should have correct text')
    t.equal(childNodes[1].textContent, "456", '.. 2. should have correct text')
    t.equal(childNodes[2].textContent, "789", '.. 3. should have correct text')
    let a = childNodes[1]
    t.equal(a.attr('data-id'), 'l1', '.. <a> should have data-id set')
    t.equal(a.attr('href'), 'foo', '.. and correct href attribute')
    t.equal(a.attr('title'), 'bar', '.. and correct title attribute')
    t.end()
  })

  test("Exporting an unordered list", function(t) {
    let { doc, exporter } = setup(t)
    let l1 = _l1(doc)
    let el = exporter.convertNode(l1)
    let childNodes = el.getChildNodes()
    t.equal(el.tagName, 'ul', 'Exported element should be a <ul>')
    t.equal(el.attr('data-id'), 'l1', '.. with correct id')
    t.equal(childNodes.length, 2, '.. and two child nodes')
    t.equal(childNodes[0].tagName, "li", '.. a <li>')
    t.equal(childNodes[0].textContent, 'Foo', ".. with content 'Foo'")
    t.equal(childNodes[1].tagName, "li", '.. and a <li>')
    t.equal(childNodes[1].textContent, 'Bar', ".. with content 'Bar'")
    t.end()
  })

  test("Exporting an ordered list", function(t) {
    let { doc, exporter } = setup(t)
    let ol = doc.create({
      type: 'list',
      id: 'ol1',
      ordered: true
    })
    let el = exporter.convertNode(ol)
    t.equal(el.tagName, 'ol', 'Exported element should be a <ol>')
    t.end()
  })

  test("Exporting a nested list", function(t) {
    let { doc, exporter } = setup(t)
    let l = _l2(doc)
    let el = exporter.convertNode(l)
    let items = el.findAll('li')
    let nestedList = el.find('ul')
    t.equal(items.length, 4, 'Exported should contain 4 list items')
    t.notNil(nestedList, '.. and a nested list')
    t.equal(nestedList.childNodes.length, 2, '.. which has 2 child nodes')
    t.end()
  })

  function setup(t, fixture) {
    let config = getTestConfig()
    let exporter = config.createExporter('html', {}, { elementFactory: t.elementFactory })
    let doc = createTestArticle(fixture)
    return { exporter, doc }
  }

}

function _li1(doc) {
  doc.create({
    type: 'list-item',
    id: 'li1',
    content: 'Foo',
    level: 1
  })
}

function _li2(doc) {
  doc.create({
    type: 'list-item',
    id: 'li2',
    content: 'Bar',
    level: 1
  })
}

function _l1(doc) {
  _li1(doc)
  _li2(doc)
  return doc.create({
    type: 'list',
    id: 'l1',
    items: ['li1', 'li2'],
    ordered: false
  })
}

function _li3(doc) {
  doc.create({
    type: 'list-item',
    id: 'li3',
    content: 'Bla',
    level: 2
  })
}

function _li4(doc) {
  doc.create({
    type: 'list-item',
    id: 'li4',
    content: 'Blupp',
    level: 2
  })
}

function _l2(doc) {
  _li1(doc)
  _li2(doc)
  _li3(doc)
  _li4(doc)
  return doc.create({
    type: 'list',
    id: 'l1',
    items: ['li1', 'li3', 'li4', 'li2'],
    ordered: false
  })
}
