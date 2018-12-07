import { test } from 'substance-test'
import { DefaultDOMElement } from 'substance'
import checkValues from './fixture/checkValues'
import getTestConfig from './fixture/getTestConfig'

const CONTENT = '0123456789'

test('XMLImporter: Importing paragraph', t => {
  let importer = _setupImporter({ 'stand-alone': true })
  let xml = '<p id="p1">' + CONTENT + '</p>'
  let el = DefaultDOMElement.parseSnippet(xml, 'xml')
  let node = importer.convertElement(el)
  checkValues(t, node, {
    id: 'p1',
    type: 'paragraph',
    content: CONTENT
  })
  t.end()
})

test('XMLImporter: Importing paragraph with strong', t => {
  let importer = _setupImporter({ 'stand-alone': true })
  let xml = '<p id="p1">0123<strong id="s1">456</strong>789</p>'
  let el = DefaultDOMElement.parseSnippet(xml, 'xml')
  let p1 = importer.convertElement(el)
  let doc = p1.getDocument()
  let s1 = doc.get('s1')
  t.equal(CONTENT, p1.content)
  t.equal('456', s1.getText())
  t.end()
})

test('XMLImporter: Importing h1', t => {
  let importer = _setupImporter({ 'stand-alone': true })
  let xml = '<h1 id="h1">' + CONTENT + '</h1>'
  let el = DefaultDOMElement.parseSnippet(xml, 'xml')
  let node = importer.convertElement(el)
  checkValues(t, node, {
    id: 'h1',
    type: 'heading',
    level: 1,
    content: CONTENT
  })
  t.end()
})

test('XMLImporter: Importing h2', t => {
  let importer = _setupImporter({ 'stand-alone': true })
  let xml = '<h2 id="h2">' + CONTENT + '</h2>'
  let el = DefaultDOMElement.parseSnippet(xml, 'xml')
  let node = importer.convertElement(el)
  checkValues(t, node, {
    id: 'h2',
    type: 'heading',
    level: 2,
    content: CONTENT
  })
  t.end()
})

test('XMLImporter: Importing meta', t => {
  let importer = _setupImporter({ 'stand-alone': true })
  let xml = '<meta><title>' + CONTENT + '</title></meta>'
  let el = DefaultDOMElement.parseSnippet(xml, 'xml')
  let node = importer.convertElement(el)
  checkValues(t, node, {
    id: 'meta',
    type: 'meta',
    title: CONTENT
  })
  t.end()
})

// FIXME: broken since introduction of file nodes
test('XMLImporter: Importing image', t => {
  let importer = _setupImporter({ 'stand-alone': true })
  let xml = '<img id="img1" src="someimage.png"></img>'
  let el = DefaultDOMElement.parseSnippet(xml, 'xml')
  let node = importer.convertElement(el)
  t.equal(node.type, 'image', 'Created node should be of type "image"')
  t.equal(node.id, 'img1', '.. with correct id')
  let file = node.getImageFile()
  t.notNil(file, 'A file node should have been created')
  t.equal(file.url, 'someimage.png', '.. containing the correct URL')
  t.end()
})

function _setupImporter (options = {}) {
  let config = getTestConfig()
  let importer = config.createImporter('xml', {}, options)
  return importer
}
