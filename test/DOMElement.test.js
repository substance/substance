import { module, spy } from 'substance-test'
import inBrowser from '../util/inBrowser'
import DefaultDOMElement from '../dom/DefaultDOMElement'

if (inBrowser) {
  DOMElementTests('BrowserDOMElement')
}

DOMElementTests('XNode')

function DOMElementTests(impl) {

  const test = module('DOMElement ('+impl+')', {
    before: () => {
      if (impl === 'XNode') DefaultDOMElement._useXNode()
    },
    after: () => {
      DefaultDOMElement._reset()
    }
  })

  test("Parsing a full HTML document", function(t) {
    var html = '<html><head><title>TEST</title></head><body>TEST</body></html>'
    var doc = DefaultDOMElement.parseHTML(html)
    var head = doc.find('head')
    t.notNil(head, '<head> should be there')

    var title = head.find('title')
    t.notNil(title, '<head> should contain <title>')
    t.equal(title.text(), 'TEST', '.. with correct text')

    var body = doc.find('body')
    t.notNil(body, 'document should have a <body> element.')
    t.equal(body.text(), 'TEST', '.. with correct text.')
    t.end()
  })

  test("Parsing one HTML element", function(t) {
    var html = '<p>TEST</p>'
    var p = DefaultDOMElement.parseHTML(html)
    t.notNil(p, 'HTML should get parsed.')
    t.equal(p.tagName, 'p', '.. providing one <p> element,')
    t.equal(p.text(), 'TEST', '.. with correct content.')
    t.end()
  })


  test("Parsing multiple HTML elements", function(t) {
    var html = '<p>TEST</p><p>TEST2</p>'
    var els = DefaultDOMElement.parseHTML(html)
    t.notNil(els, 'HTML should get parsed.')
    t.equal(els.length, 2, '.. Providing 2 elements')
    t.equal(els[0].tagName, 'p', '.. the first a <p>')
    t.equal(els[0].text(), 'TEST', '.. with correct content')
    t.equal(els[1].tagName, 'p', '.. the second a <p>')
    t.equal(els[1].text(), 'TEST2', '.. with correct content')
    t.end()
  })

  test("Parsing annotated HTML text", function(t) {
    var html = '123<b>456</b>789'
    var els = DefaultDOMElement.parseHTML(html)
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

  test("Parsing an XML document", function(t) {
    var xml = "<mydoc><myhead><mytitle>TEST</mytitle></myhead><mybody>TEST</mybody></mydoc>"
    var doc = DefaultDOMElement.parseXML(xml)
    var head = doc.find('myhead')
    t.notNil(head, '<myhead> should be there')
    var title = head.find('mytitle')
    t.notNil(title, '<head> should contain <title>')
    t.equal(title.text(), 'TEST', '.. with correct text')
    var body = doc.find('mybody')
    t.notNil(body, 'document should have a <body> element')
    t.equal(body.text(), 'TEST', '.. with correct text')
    t.end()
  })

  test("hasClass", function(t) {
    var p = DefaultDOMElement.parseHTML('<p class="foo">TEST</p>')
    t.ok(p.hasClass('foo'), 'Element should have class "foo".')
    t.end()
  })

  test("addClass", function(t) {
    var p = DefaultDOMElement.parseHTML('<p>TEST</p>')
    p.addClass('foo')
    t.ok(p.hasClass('foo'), 'Element should have class "foo".')
    t.end()
  })

  test("outerHTML", function(t) {
    var p = DefaultDOMElement.parseHTML('<p class="foo">TEST</p>')
    t.equal(p.outerHTML, '<p class="foo">TEST</p>', 'outerHTML should be complete')
    t.end()
  })

  test("outerHTML of XML with camelCase tagnames", function(t) {
    let el = DefaultDOMElement.parseXML('<dummy><myNode></myNode></dummy>')
    t.equal(el.outerHTML, '<dummy><myNode/></dummy>', 'XML tags should be serialized preserving case.')
    t.end()
  })

  test("removeClass", function(t) {
    var p = DefaultDOMElement.parseHTML('<p class="foo">TEST</p>')
    p.removeClass('foo')
    t.notOk(p.hasClass('foo'), 'Element should not have class "foo".')
    t.end()
  })

  test("setTagName", function(t) {
    var el = DefaultDOMElement.parseHTML('<p class="foo">ABC<b>DEF</b>GHI</p>')
    var onClick = spy()
    el.on('click', onClick)
    // this call is brutal as a new element needs to be created
    // and all the content and attributes be copied over
    el.setTagName('h1')
    t.equal(el.tagName, 'h1', 'Now the element should be a heading')
    t.equal(el.textContent, 'ABCDEFGHI', '.. its text content should have been preserved')
    t.equal(el.getChildCount(), 3, '.. and its children should still be there')
    t.notNil(el.find('b'), '.. including the <b> element')
    el.click()
    t.equal(onClick.callCount, 1, '.. and even the click handler should still work')
    t.end()
  })

  test("setTagName on XML should create XML elements", function(t) {
    var el = DefaultDOMElement.parseXML('<dummy></dummy>')
    // this call is brutal as a new element needs to be created
    // and all the content and attributes be copied over
    el.setTagName('foo')
    t.equal(el.getNativeElement().ownerDocument.contentType, 'application/xml', 'Element should still be an XML element')
    el.setInnerHTML('<link>foo</link>')
    // when using an HTML element <link> will get exported as self-closing
    t.equal(el.outerHTML, '<foo><link>foo</link></foo>')
    t.end()
  })

  test("find via tagname", function(t) {
    let el = DefaultDOMElement.parseXML('<dummy><foo></foo></dummy>')
    let foo = el.find('foo')
    t.notNil(foo, 'Should find a <foo> element')
    t.end()
  })

  test("find multiple elements", function(t) {
    let el = DefaultDOMElement.parseXML('<dummy><foo>Bla</foo><foo>Blupp</foo></dummy>')
    let foos = el.findAll('foo')
    t.equal(foos.length, 2, 'Should find two <foo> elements')
    t.equal(foos[0].textContent, 'Bla', '... with correct textContent')
    t.equal(foos[1].textContent, 'Blupp', '... with correct textContent')
    t.end()
  })

  test("find via #id", function(t) {
    let el = DefaultDOMElement.parseXML('<dummy><bla id="foo"></bla></dummy>')
    let foo = el.find('#foo')
    t.notNil(foo, 'Should find a #foo element')
    t.end()
  })

  test("find via attr", function(t) {
    let el = DefaultDOMElement.parseXML('<dummy><bla data-id="foo"></bla></dummy>')
    let foo = el.find('[data-id=foo]')
    t.notNil(foo, 'Should find a element with data-id=foo')
    t.end()
  })

  test("find in XML with camelCase tagnames", function(t) {
    let el = DefaultDOMElement.parseXML('<dummy><myNode myValue="foo"></myNode></dummy>')
    t.notNil(el.find('myNode'), 'Should find a <myNode> element')
    t.notNil(el.find('[myValue="foo"]'), 'Should find a [myValue] element')
    t.end()
  })

  test("insertAt", function(t) {
    let dummy = DefaultDOMElement.parseXML('<dummy><bla></bla></dummy>')
    let doc = dummy.getOwnerDocument()
    let newChild = doc.createElement('blupp')
    dummy.insertAt(1, newChild)
    t.equal(dummy.getChildCount(), 2, 'There should be 2 children now')
    t.ok(dummy.getChildAt(0).is('bla'), '.. the first should be <bla>')
    t.ok(dummy.getChildAt(1).is('blupp'), '.. the second should be <blupp>')
    t.end()
  })

  test("reattaching an element via insertAt", function(t) {
    let dummy = DefaultDOMElement.parseXML('<dummy><bla><blupp></blupp></bla></dummy>')
    let blupp = dummy.find('blupp')
    dummy.insertAt(0, blupp)
    t.equal(dummy.getChildCount(), 2, 'There should be 2 children now')
    t.ok(dummy.getChildAt(0).is('blupp'), '.. the first should be <blupp>')
    t.ok(dummy.getChildAt(1).is('bla'), '.. the second should be <bla>')
    t.equal(dummy.getChildAt(1).getChildCount(), 0, '.. and <bla> should have no children')
    t.end()
  })

  test("reattaching an element via append", function(t) {
    let dummy = DefaultDOMElement.parseXML('<dummy><bla><blupp></blupp></bla></dummy>')
    let blupp = dummy.find('blupp')
    dummy.appendChild(blupp)
    t.equal(dummy.getChildCount(), 2, 'There should be 2 children now')
    t.ok(dummy.getChildAt(0).is('bla'), '.. the first should be <bla>')
    t.ok(dummy.getChildAt(1).is('blupp'), '.. the second should be <blupp>')
    t.equal(dummy.getChildAt(0).getChildCount(), 0, '.. and <bla> should have no children')
    t.end()
  })

  test("children should only include elements", function(t) {
    let dummy = DefaultDOMElement.parseXML('<dummy>bli<bla></bla>blupp</dummy>')
    t.equal(dummy.children.length, 1, 'Should return only elements')
    t.equal(dummy.children[0].tagName, 'bla', 'Should be bla')
    t.end()
  })

}
