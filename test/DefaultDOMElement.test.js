import { test as substanceTest } from 'substance-test'
import { DefaultDOMElement, MemoryDOMElement, platform } from 'substance'

if (platform.inBrowser) {
  DOMElementTests('BrowserDOMElement')
}

DOMElementTests('MemoryDOMElement')

function DOMElementTests (impl) {
  const LABEL = `DefaultDOMElment (${impl})`
  const test = (title, fn) => substanceTest(`${LABEL}: ${title}`, fn, {
    before () {
      if (impl === 'MemoryDOMElement') platform.inBrowser = false
    },
    after () {
      platform._reset()
    }
  })

  test('Wrapping a native element', (t) => {
    let doc
    if (impl === 'BrowserDOMElement') {
      doc = window.document
    } else {
      doc = MemoryDOMElement.createDocument('html')
    }
    let nativeEl = doc.createElement('div')
    let el = DefaultDOMElement.wrap(nativeEl)
    t.ok(el._isDOMElement, 'native element should be wrapped')
    let el2 = DefaultDOMElement.wrap(nativeEl)
    t.ok(el === el2, 'wrapping an element twice should give the same DOMElement instance')
    t.throws(() => {
      DefaultDOMElement.wrap(undefined)
    }, 'Should throw when trying to wrap nil')
    t.end()
  })

  test('Creating an HTML document', (t) => {
    const doc = DefaultDOMElement.createDocument('html')
    t.notNil(doc.find('head'), 'Document should have a <head>')
    t.notNil(doc.find('body'), '.. and a <body>')
    t.equal(doc.getContentType(), 'text/html', '.. content type should be correct')
    t.end()
  })

  test('Creating an XML document', (t) => {
    const doc = DefaultDOMElement.createDocument('xml')
    t.equal(doc.getContentType(), 'application/xml', 'Document should have correct content type')
    t.equal(doc.children.length, 0, '.. and should be empty')
    t.end()
  })

  test('Parsing a full HTML document', function (t) {
    const html = '<html><head><title>TEST</title></head><body>TEST</body></html>'
    const doc = DefaultDOMElement.parseHTML(html)
    const head = doc.find('head')
    t.notNil(head, '<head> should be there')

    const title = head.find('title')
    t.notNil(title, '<head> should contain <title>')
    t.equal(title.text(), 'TEST', '.. with correct text')

    const body = doc.find('body')
    t.notNil(body, 'document should have a <body> element.')
    t.equal(body.text(), 'TEST', '.. with correct text.')
    t.end()
  })

  test('Parsing one HTML element', function (t) {
    const html = '<p>TEST</p>'
    const p = DefaultDOMElement.parseSnippet(html, 'html')
    t.notNil(p, 'HTML should get parsed.')
    t.equal(p.tagName, 'p', '.. providing one <p> element,')
    t.equal(p.text(), 'TEST', '.. with correct content.')
    t.end()
  })

  test('Parsing multiple HTML elements', function (t) {
    const html = '<p>TEST</p><p>TEST2</p>'
    const els = DefaultDOMElement.parseSnippet(html, 'html')
    t.notNil(els, 'HTML should get parsed.')
    t.equal(els.length, 2, '.. Providing 2 elements')
    t.equal(els[0].tagName, 'p', '.. the first a <p>')
    t.equal(els[0].text(), 'TEST', '.. with correct content')
    t.equal(els[1].tagName, 'p', '.. the second a <p>')
    t.equal(els[1].text(), 'TEST2', '.. with correct content')
    t.end()
  })

  test('Parsing annotated HTML text', function (t) {
    const html = '123<b>456</b>789'
    const els = DefaultDOMElement.parseSnippet(html, 'html')
    t.equal(els.length, 3, 'there are three elements')
    t.equal(els[0].nodeType, 'text', 'first is a text node')
    t.equal(els[0].text(), '123', '... it has correct content')
    t.equal(els[1].nodeType, 'element', 'second is an element')
    t.equal(els[1].tagName, 'b', '... it is a <b>')
    t.equal(els[1].text(), '456', '... it has correct content')
    t.equal(els[2].nodeType, 'text', 'third is a text node again')
    t.equal(els[2].text(), '789', '... it has correct content')
    t.end()
  })

  test('Parsing an XML document', function (t) {
    const xml = '<mydoc><myhead><mytitle>TEST</mytitle></myhead><mybody>TEST</mybody></mydoc>'
    const doc = DefaultDOMElement.parseXML(xml)
    const head = doc.find('myhead')
    t.notNil(head, '<myhead> should be there')
    const title = head.find('mytitle')
    t.notNil(title, '<head> should contain <title>')
    t.equal(title.text(), 'TEST', '.. with correct text')
    const body = doc.find('mybody')
    t.notNil(body, 'document should have a <body> element')
    t.equal(body.text(), 'TEST', '.. with correct text')
    t.end()
  })

  test('Parsing an incomplete HTML document', (t) => {
    const doc = DefaultDOMElement.parseHTML('<title>Foo</title><p>TEST</p>')
    const head = doc.find('head')
    const title = head.find('title')
    const body = doc.find('body')
    t.notNil(head, 'document should have a <head>')
    t.notNil(title, '<head> should contain <title>')
    t.equal(title.textContent, 'Foo', 'title should be correct')
    t.equal(body.innerHTML, '<p>TEST</p>', 'body should have contain the remaining content')
    t.end()
  })

  test('Parsing an HTML document with comments', (t) => {
    let doc = DefaultDOMElement.parseHTML('<body><!--TEST--></body>')
    let body = doc.find('body')
    let comment = body.firstChild
    t.notNil(comment, 'there should a child element')
    t.ok(comment.isCommentNode(), '.. which should be a comment')
    t.equal(comment.textContent, 'TEST', '.. with correct content')
    // multiple lines
    doc = DefaultDOMElement.parseHTML('<body><!--\n  TEST\n  Foo\n  Bar--></body>')
    body = doc.find('body')
    comment = body.firstChild
    t.equal(comment.textContent, '\n  TEST\n  Foo\n  Bar', 'multi-line comment should work too')
    /*
      NOTE: from looking at the default implementation in htmlparser2 it seems that they would merge subsequent comments
        but actually this is not the case. So, there is a branch in oncomment() which I do not understand
        The same with TextNodes.
        ```
        if(lastTag && lastTag.type === ElementType.Comment){
          lastTag.data += data
        }
        ```
    */
    // doc = DefaultDOMElement.parseHTML('<body><!--FOO--><!--BAR--></body>')
    // body = doc.find('body')
    // t.deepEqual(body.childNodes.map(c=>c.nodeType), ['comment','comment'], 'subsequent comments should not be merged')
    t.end()
  })

  test('Parsing an XML document with CDATA', (t) => {
    let foo = DefaultDOMElement.parseSnippet(`<foo><![CDATA[TEST]]></foo>`, 'xml')
    let cdata = foo.firstChild
    t.notNil(cdata, 'there should a child element')
    t.equal(cdata.nodeType, 'cdata', '.. which should be CDATA')
    t.equal(cdata.textContent, 'TEST', '.. with correct content')
    t.end()
  })

  test('Parsing void and self-closing elements', (t) => {
    t.throws(() => {
      DefaultDOMElement.parseSnippet(`<foo>`, 'xml')
    }, 'should not allow void elements in XML')
    t.doesNotThrow(() => {
      DefaultDOMElement.parseSnippet(`<foo />`, 'xml')
    }, 'should allow self-closing elements in XML')
    t.doesNotThrow(() => {
      DefaultDOMElement.parseSnippet(`<input>`, 'html')
      DefaultDOMElement.parseSnippet(`<input />`, 'html')
    }, 'in HTML there are some allowed void elements, such as <input>')
    t.end()
  })
}
