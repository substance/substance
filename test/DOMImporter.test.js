import { module } from 'substance-test'
import { DOMImporter, DefaultDOMElement } from 'substance'
import getTestConfig from './fixture/getTestConfig'

const test = module('DOMImporter')

const pConverter = {
  type: 'paragraph',
  tagName: 'p',
  import(el, node, converter) {
    node.content = converter.annotatedText(el, [node.id, 'content'])
  }
}

test("creating a DOMImporter", (t) => {
  const schema = getTestConfig().getSchema()
  // fail without converters
  t.throws(() => {
    new DOMImporter({ schema })
  }, 'should throw if no converters are given')
  // fail without DocumentClass
  t.throws(() => {
    new DOMImporter({ converters: [] })
  }, 'should throw if schema is not given')
  // fail if a converter has no associated type
  t.throws(() => {
    new DOMImporter({ schema, converters: [{
      matchElement() { return true }
    }] })
  }, 'should throw if a converter does not have associated type')
  // fail if a converter has no matcher
  t.throws(() => {
    new DOMImporter({ schema, converters: [{
      type: 'paragraph'
    }] })
  }, 'should throw if a converter does not have a matcher function')
  t.throws(() => {
    new DOMImporter({ schema, converters: [{
      type: 'foo', tagName: 'h1'
    }] })
  }, 'should throw if a converter is associated with an unknown node type')
  t.end()
})

test("default matchElement()", (t) => {
  const testConverter = {
    type: 'paragraph', tagName: 'p'
  }
  const importer = createImporter([testConverter])
  t.notNil(importer._allConverters[0].matchElement, 'registered converter should have a matchElement() function')
  t.end()
})

test("using a Converter class", (t) => {
  class MyConverter {
    get type() { return 'paragraph' }
    get tagName() { return 'p' }
  }
  const importer = createImporter([MyConverter])
  t.equal(importer._allConverters[0].tagName, 'p', 'there should be one converter registered for <p>')
  t.end()
})

test("convertElement() -- block element", (t) => {
  const importer = createImporter()
  const el = DefaultDOMElement.parseSnippet('<p>TEST</p>', 'html')
  const node = importer.convertElement(el)
  t.equal(node.type, 'paragraph', 'should have converted element to node')
  t.end()
})

// Note: it is not common to convert inline nodes outside of their context -- that's why they are called inline
test("convertElement() -- inline node", (t) => {
  const testConverter = {
    type: 'test-inline-node',
    matchElement(el) { return el.is('[data-type=test-inline-node]') },
    import(el, node) {
      node.content = el.textContent
    }
  }
  const importer = createImporter([pConverter, testConverter])
  const el = DefaultDOMElement.parseSnippet('<span data-type="test-inline-node">TEST</span>', 'html')
  const node = importer.convertElement(el)
  t.equal(node.type, 'test-inline-node', 'should have converted element to node')
  t.end()
})

// Note: it is not common to convert annotations outside of their context
test("convertElement() -- annotation element", (t) => {
  const importer = createImporter()
  const el = DefaultDOMElement.parseSnippet('<b>TEST</b>', 'html')
  const node = importer.convertElement(el)
  t.equal(node.type, 'strong', 'should have converted element to node')
  t.end()
})

test("convertElement() should throw if no converter found", (t) => {
  const importer = createImporter([pConverter])
  const el = DefaultDOMElement.parseSnippet('<h1>TEST</h1>', 'html')
  t.throws(() => {
    importer.convertElement(el)
  }, 'should throw if no converter found')
  t.end()
})

test("converting paragraph with inline node", (t) => {
  const testConverter = {
    type: 'test-inline-node',
    matchElement(el) { return el.is('[data-type=test-inline-node]') }
  }
  const importer = createImporter([pConverter, testConverter])
  const el = DefaultDOMElement.parseSnippet('<p>abc <span data-type="test-inline-node">TEST</span> def</p>', 'html')
  const node = importer.convertElement(el)
  t.equal(node.content, `abc ${DOMImporter.INVISIBLE_CHARACTER} def`, 'should have inserted an invisible character')
  t.end()
})

test("converting an annotated paragraph", (t) => {
  const importer = createImporter()
  const el = DefaultDOMElement.parseSnippet('<p>abc <b>TEST</b> def</p>', 'html')
  const node = importer.convertElement(el)
  const doc = node.getDocument()
  const annos = doc.getAnnotations([node.id])
  t.equal(annos.length, 1, 'there should be one annotation')
  t.end()
})


test("plainText()", (t) => {
  const testConverter = Object.assign({}, pConverter, {
    import(el, node, converter) {
      node.content = converter.plainText(el)
    }
  })
  const importer = createImporter([testConverter])
  const el = DefaultDOMElement.parseSnippet('<p>abc <b>TEST</b> def</p>', 'html')
  const node = importer.convertElement(el)
  t.equal(node.content, `abc TEST def`, 'should have converted plain text')
  t.end()
})

test("convertContainer() -- trailing text", (t) => {
  const importer = createImporter()
  const els = DefaultDOMElement.parseSnippet('<p>A paragraph</p> and some trailing text', 'html')
  let container = importer.convertContainer(els, 'body')
  t.equal(container.getLength(), 2, 'should have two nodes')
  t.deepEqual(container.getNodes().map(n=>n.type), ['paragraph', 'paragraph'], 'both should be paragraphs')
  t.end()
})

test("resolving id collisions", (t) => {
  // converter with 'tagName' gets a default matcher
  const importer = createImporter()
  const els = DefaultDOMElement.parseSnippet('<p id="foo">A paragraph</p><p id="foo">and another one with the same id</p>', 'html')
  let container = importer.convertContainer(els, 'body')
  t.equal(container.getLength(), 2, 'should have two nodes')
  t.equal(container.getNodeIdAt(0), 'foo', 'first should have the original id')
  t.notEqual(container.getNodeIdAt(1), 'foo', 'second should have a new one')
  t.end()
})

/*
TODO:
  - import with options
*/

function createImporter(converters) {
  const config = getTestConfig()
  const schema = config.getSchema()
  if (!converters) {
    converters = config.getConverterRegistry().get('html').values()
  }
  return new DOMImporter({
    schema,
    converters: converters
  })
}
