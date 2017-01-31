import { module } from 'substance-test'
import DOMElement from '../dom/DefaultDOMElement'
import TestXMLImporter from './fixture/TestXMLImporter'
import checkValues from './fixture/checkValues'

const test = module('XMLImporter')

const CONTENT = '0123456789'

test("Importing paragraph", function(t) {
  let importer = new TestXMLImporter('stand-alone')
  let xml = '<p id="p1">' + CONTENT + '</p>'
  let el = DOMElement.parseXML(xml)
  let node = importer.convertElement(el)
  checkValues(t, node, {
    id: "p1",
    type: "paragraph",
    content: CONTENT
  })
  t.end()
})

test("Importing paragraph with strong", function(t) {
  let importer = new TestXMLImporter('stand-alone')
  let xml = '<p id="p1">0123<strong id="s1">456</strong>789</p>'
  let el = DOMElement.parseXML(xml)
  let p1 = importer.convertElement(el)
  let doc = p1.getDocument()
  let s1 = doc.get('s1')
  t.equal(CONTENT, p1.content)
  t.equal('456', s1.getText())
  t.end()
})

test("Importing h1", function(t) {
  let importer = new TestXMLImporter('stand-alone')
  let xml = '<h1 id="h1">' + CONTENT + '</h1>'
  let el = DOMElement.parseXML(xml)
  let node = importer.convertElement(el)
  checkValues(t, node, {
    id: "h1",
    type: "heading",
    level: 1,
    content: CONTENT
  })
  t.end()
})

test("Importing h2", function(t) {
  let importer = new TestXMLImporter('stand-alone')
  let xml = '<h2 id="h2">' + CONTENT + '</h2>'
  let el = DOMElement.parseXML(xml)
  let node = importer.convertElement(el)
  checkValues(t, node, {
    id: "h2",
    type: "heading",
    level: 2,
    content: CONTENT
  })
  t.end()
})

test("Importing meta", function(t) {
  let importer = new TestXMLImporter('stand-alone')
  let xml = '<meta><title>' + CONTENT + '</title></meta>'
  let el = DOMElement.parseXML(xml)
  let node = importer.convertElement(el)
  checkValues(t, node, {
    id: 'meta',
    type: 'meta',
    title: CONTENT
  })
  t.end()
})

// FIXME: broken since introduction of file nodes
// test("Importing image", function(t) {
//  let importer = new TestXMLImporter('stand-alone')
//   let xml = '<image id="img1" src="someimage.png" preview-src="someimagepreview.png"/>'
//   let el = DOMElement.parseXML(xml)
//   let node = importer.convertElement(el)
//   t.deepEqual(node.toJSON(), {
//     id: 'img1',
//     type: 'image',
//     src: 'someimage.png',
//     previewSrc: 'someimagepreview.png'
//   })
//   t.end()
// })
