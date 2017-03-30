import { module } from 'substance-test'
import { DefaultDOMElement, MemoryDOMElement, platform } from 'substance'
import createTestArticle from './fixture/createTestArticle'
import simple from './fixture/simple'
import getTestConfig from './fixture/getTestConfig'

const CONTENT = '0123456789'

XMLExporterTests()

if (platform.inBrowser) {
  XMLExporterTests('memory')
}

function XMLExporterTests(memory) {

  const test = module('XMLExporter' + ( memory ? ' [memory]' : ''), {
    before: function(t) {
      t.elementFactory = memory ? MemoryDOMElement.createDocument('xml') : DefaultDOMElement.createDocument('xml')
    }
  })

  test("Exporting paragraph", function(t) {
    let { doc, exporter } = setup(t)
    let p1 = doc.create({ type: 'paragraph', id: 'p1', content: CONTENT })
    let el = exporter.convertNode(p1)
    let actual = el.serialize()
    let expected = '<p id="p1">' + CONTENT + '</p>'
    t.equal(actual, expected)
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
    let actual = el.serialize()
    let expected = '<p id="p1">0123<strong id="s1">456</strong>789</p>'
    t.equal(actual, expected)
    t.end()
  })

  test("Exporting h1", function(t) {
    let { doc, exporter } = setup(t)
    let h1 = doc.create({ type: 'heading', id: 'h1', level: 1, content: CONTENT })
    let el = exporter.convertNode(h1)
    let actual = el.serialize()
    let expected = '<h1 id="h1">' + CONTENT + '</h1>'
    t.equal(actual, expected)
    t.end()
  })

  test("Exporting h2", function(t) {
    let { doc, exporter } = setup(t)
    let h2 = doc.create({ type: 'heading', id: 'h2', level: 2, content: CONTENT })
    let el = exporter.convertNode(h2)
    let actual = el.serialize()
    let expected = '<h2 id="h2">' + CONTENT + '</h2>'
    t.equal(actual, expected)
    t.end()
  })

  test("Exporting simple document", function(t) {
    let { doc, exporter } = setup(t, simple)
    let rootEl = exporter.exportDocument(doc)
    let actual = rootEl.serialize()
    let expected = [
      '<article>',
      '<p id="p1">' + CONTENT + '</p>',
      '<p id="p2">' + CONTENT + '</p>',
      '<p id="p3">' + CONTENT + '</p>',
      '<p id="p4">' + CONTENT + '</p>',
      '</article>'
    ].join('')
    t.equal(expected, actual)
    t.end()
  })

  test("Exporting meta", function(t) {
    let { doc, exporter } = setup(t)
    let meta = doc.create({
      type: "meta",
      id: "meta",
      title: 'Untitled'
    })
    let el = exporter.convertNode(meta)
    let actual = el.serialize()
    let expected = '<meta id="meta"><title>Untitled</title></meta>'
    t.equal(actual, expected)
    t.ok(true)
    t.end()
  })

  // FIXME: broken since introduction of file nodes
  // test("Exporting image", function(t) {
  //   let data = { type: 'image', id: 'img1', 'src': 'img1.png', 'previewSrc': 'img1preview.png' }
  //   let img = doc.create(data)
  //   let el = exporter.convertNode(img)
  //   t.equal(el.tagName.toLowerCase(), 'image')
  //   t.equal(el.id, 'img1')
  //   t.equal(el.getAttribute('src'), 'img1.png')
  //   t.end()
  // })

  function setup(t, fixture) {
    let config = getTestConfig()
    let exporter = config.createExporter('xml', {}, { elementFactory: t.elementFactory })
    let doc = createTestArticle(fixture)
    return { exporter, doc }
  }
}