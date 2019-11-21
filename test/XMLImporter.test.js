import { test } from 'substance-test'
import { DefaultDOMElement } from 'substance'
import checkValues from './shared/checkValues'
import getTestConfig from './shared/getTestConfig'
import createTestArticle from './shared/createTestArticle'

const CONTENT = '0123456789'

test('XMLImporter: Importing paragraph', t => {
  const importer = _setupImporter({ 'stand-alone': true })
  const xml = '<p id="p1">' + CONTENT + '</p>'
  const el = DefaultDOMElement.parseSnippet(xml, 'xml')
  const node = importer.convertElement(el)
  checkValues(t, node, {
    id: 'p1',
    type: 'paragraph',
    content: CONTENT
  })
  t.end()
})

test('XMLImporter: Importing paragraph with strong', t => {
  const importer = _setupImporter({ 'stand-alone': true })
  const xml = '<p id="p1">0123<strong id="s1">456</strong>789</p>'
  const el = DefaultDOMElement.parseSnippet(xml, 'xml')
  const p1 = importer.convertElement(el)
  const doc = p1.getDocument()
  const s1 = doc.get('s1')
  t.equal(CONTENT, p1.content)
  t.equal('456', s1.getText())
  t.end()
})

test('XMLImporter: Importing h1', t => {
  const importer = _setupImporter({ 'stand-alone': true })
  const xml = '<h1 id="h1">' + CONTENT + '</h1>'
  const el = DefaultDOMElement.parseSnippet(xml, 'xml')
  const node = importer.convertElement(el)
  checkValues(t, node, {
    id: 'h1',
    type: 'heading',
    level: 1,
    content: CONTENT
  })
  t.end()
})

test('XMLImporter: Importing h2', t => {
  const importer = _setupImporter({ 'stand-alone': true })
  const xml = '<h2 id="h2">' + CONTENT + '</h2>'
  const el = DefaultDOMElement.parseSnippet(xml, 'xml')
  const node = importer.convertElement(el)
  checkValues(t, node, {
    id: 'h2',
    type: 'heading',
    level: 2,
    content: CONTENT
  })
  t.end()
})

test('XMLImporter: Importing meta', t => {
  const importer = _setupImporter({ 'stand-alone': true })
  const xml = '<meta><title>' + CONTENT + '</title></meta>'
  const el = DefaultDOMElement.parseSnippet(xml, 'xml')
  const node = importer.convertElement(el)
  checkValues(t, node, {
    id: 'meta',
    type: 'meta',
    title: CONTENT
  })
  t.end()
})

function _setupImporter (options = {}) {
  const config = getTestConfig()
  const doc = createTestArticle()
  const importer = config.createImporter('xml', doc, options)
  return importer
}
