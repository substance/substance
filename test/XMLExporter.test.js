import { test as substanceTest } from 'substance-test'
import { DefaultDOMElement, MemoryDOMElement, platform } from 'substance'
import createTestArticle from './shared/createTestArticle'
import getTestConfig from './shared/getTestConfig'
import simple from './fixture/simple'

const CONTENT = '0123456789'

XMLExporterTests()

if (platform.inBrowser) {
  XMLExporterTests('memory')
}

function XMLExporterTests (memory) {
  const LABEL = 'XMLExporter' + (memory ? ' [memory]' : '')
  const test = (title, fn) => substanceTest(`${LABEL}: ${title}`, t => {
    // before
    t.elementFactory = memory ? MemoryDOMElement.createDocument('xml') : DefaultDOMElement.createDocument('xml')
    fn(t)
  })

  test('Exporting paragraph', function (t) {
    const { doc, exporter } = setup(t)
    const p1 = doc.create({ type: 'paragraph', id: 'p1', content: CONTENT })
    const el = exporter.convertNode(p1)
    const actual = el.serialize()
    const expected = '<p id="p1">' + CONTENT + '</p>'
    t.equal(actual, expected)
    t.end()
  })

  test('Exporting paragraph with strong', function (t) {
    const { doc, exporter } = setup(t)
    const p1 = doc.create({ type: 'paragraph', id: 'p1', content: CONTENT })
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
    const el = exporter.convertNode(p1)
    const actual = el.serialize()
    const expected = '<p id="p1">0123<strong id="s1">456</strong>789</p>'
    t.equal(actual, expected)
    t.end()
  })

  test('Exporting h1', function (t) {
    const { doc, exporter } = setup(t)
    const h1 = doc.create({ type: 'heading', id: 'h1', level: 1, content: CONTENT })
    const el = exporter.convertNode(h1)
    const actual = el.serialize()
    const expected = '<h1 id="h1">' + CONTENT + '</h1>'
    t.equal(actual, expected)
    t.end()
  })

  test('Exporting h2', function (t) {
    const { doc, exporter } = setup(t)
    const h2 = doc.create({ type: 'heading', id: 'h2', level: 2, content: CONTENT })
    const el = exporter.convertNode(h2)
    const actual = el.serialize()
    const expected = '<h2 id="h2">' + CONTENT + '</h2>'
    t.equal(actual, expected)
    t.end()
  })

  test('Exporting simple document', function (t) {
    const { doc, exporter } = setup(t, simple)
    const rootEl = exporter.exportDocument(doc)
    const actual = rootEl.serialize()
    const expected = [
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

  test('Exporting meta', function (t) {
    const { doc, exporter } = setup(t)
    const meta = doc.create({
      type: 'meta',
      id: 'meta',
      title: 'Untitled'
    })
    const el = exporter.convertNode(meta)
    const actual = el.serialize()
    const expected = '<meta id="meta"><title>Untitled</title></meta>'
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

  function setup (t, fixture) {
    const config = getTestConfig()
    const doc = createTestArticle(fixture)
    const exporter = config.createExporter('xml', doc, { elementFactory: t.elementFactory })
    return { exporter, doc }
  }
}
