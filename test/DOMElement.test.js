import { module, spy } from 'substance-test'
import { DefaultDOMElement, platform } from 'substance'

if (platform.inBrowser) {
  DOMElementTests('BrowserDOMElement')
}

DOMElementTests('MemoryDOMElement')

function DOMElementTests(impl) {

  const test = module('DOMElement ('+impl+')', {
    before: () => {
      if (impl === 'MemoryDOMElement') platform.inBrowser = false
    },
    after: () => {
      platform._reset()
    }
  })

  test("getNativeElement()", (t) => {
    let doc = DefaultDOMElement.createDocument('html')
    let el = doc.createElement('div')
    const nativeEl = el.getNativeElement()
    let isNative
    if (impl === 'BrowserDOMElement') {
      isNative = nativeEl instanceof window.Element
    } else {
      isNative = nativeEl._isMemoryDOMElement
    }
    t.ok(isNative, 'should return a native element.')
    t.end()
  })

  test("getNodeType()", function(t) {
    let doc = DefaultDOMElement.createDocument('html')
    t.equal(doc.getNodeType(), 'document', 'document should have correct node type')
    let el = doc.createElement('div')
    t.equal(el.getNodeType(), 'element', 'element should have correct node type')
    t.equal(el.nodeType, 'element', '.. should also work via property getter')
    t.ok(el.isElementNode(), '.. should tell it is an element node')
    el = doc.createTextNode('foo')
    t.equal(el.getNodeType(), 'text', 'textNode should have correct node type')
    t.ok(el.isTextNode(), '.. and should tell it is a text node')
    el = doc.createComment('Hallo World!')
    t.equal(el.getNodeType(), 'comment', 'comment element should have correct node type')
    t.ok(el.isCommentNode(), '.. and should tell it is a comment node')
    el = doc.createProcessingInstruction('foo', 'bar')
    t.equal(el.getNodeType(), 'directive', 'procession instruction element should have correct node type')
    // cdata only allowed in XML documents
    doc = DefaultDOMElement.createDocument('xml')
    el = doc.createCDATASection('XYZ')
    t.equal(el.getNodeType(), 'cdata', 'cdata element should have correct node type')
    t.end()
  })

  test("getTagName()", function(t) {
    const el = DefaultDOMElement.parseSnippet('<p></p>', 'html')
    t.equal(el.getTagName(), 'p', 'should have correct tagName')
    t.equal(el.tagName, 'p', 'should also work with property accessor')
    t.equal(el.nodeName, 'p', 'nodeName is an alias')
    t.end()
  })

  test("getTagName() in HTML is always lower case", function(t) {
    const el = DefaultDOMElement.parseSnippet('<DIV></DIV>', 'html')
    t.equal(el.tagName, 'div', 'should bet lower case')
    t.end()
  })

  test("getTagName() in XML does not change case", function(t) {
    const el = DefaultDOMElement.parseSnippet('<myNode></myNode>', 'xml')
    t.equal(el.tagName, 'myNode', 'case should be changed')
    t.end()
  })

  test("setTagName()", function(t) {
    const el = DefaultDOMElement.parseSnippet('<p></p>', 'html')
    // NOTE: in the browser this will be done by replacing the native element
    el.setTagName('div')
    t.equal(el.getTagName(), 'div', 'should have changed the tagName')
    el.tagName = 'h1'
    t.equal(el.getTagName(), 'h1', 'should also work via property setter')
    t.end()
  })

  test("getId()", function(t) {
    const el = DefaultDOMElement.parseSnippet('<div id="foo"></div>', 'html')
    t.equal(el.getId(), 'foo', 'should have correct id')
    t.equal(el.id, 'foo', 'should also work with property accessor')
    t.end()
  })

  test("setId()", function(t) {
    const el = DefaultDOMElement.parseSnippet('<div id="foo"></div>', 'html')
    el.setId('bar')
    t.equal(el.getId(), 'bar', 'should have changed id')
    el.id = 'baz'
    t.equal(el.getId(), 'baz', 'should also work using property setter')
    t.end()
  })

  test("setTagName", function(t) {
    var el = DefaultDOMElement.parseSnippet('<p class="foo">ABC<b>DEF</b>GHI</p>', 'html')
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
    var el = DefaultDOMElement.parseSnippet('<dummy></dummy>', 'xml')
    // this call is brutal as a new element needs to be created
    // and all the content and attributes be copied over
    el.setTagName('foo')
    t.equal(el.getNativeElement().ownerDocument.contentType, 'application/xml', 'Element should still be an XML element')
    el.setInnerHTML('<link>foo</link>')
    // when using an HTML element <link> will get exported as self-closing
    t.equal(el.outerHTML, '<foo><link>foo</link></foo>')
    t.end()
  })

  test("hasClass()", function(t) {
    const el = DefaultDOMElement.parseSnippet('<div class="foo">TEST</div>', 'html')
    t.ok(el.hasClass('foo'), 'should have class "foo".')
    t.end()
  })

  test("addClass()", function(t) {
    let doc = DefaultDOMElement.createDocument('html')
    const el = doc.createElement('div')
    el.addClass('foo')
    t.ok(el.hasClass('foo'), 'should have class "foo".')
    t.end()
  })

  test("'class' attribute", (t) => {
    let doc = DefaultDOMElement.createDocument('html')
    const el = doc.createElement('div')
    el.setAttribute('class', 'foo bar')
    t.ok(el.hasClass('foo'), 'should have class "foo" set')
    t.ok(el.hasClass('bar'), 'should have class "bar" set')
    t.end()
  })

  test("removeClass()", function(t) {
    const el = DefaultDOMElement.parseSnippet('<div class="foo">TEST</div>', 'html')
    el.removeClass('foo')
    t.notOk(el.hasClass('foo'), 'class should have been removed')
    t.end()
  })

  test("hasAttribute()", (t) => {
    const el = DefaultDOMElement.parseSnippet('<div foo="foo">TEST</div>', 'html')
    t.ok(el.hasAttribute('foo'), 'should have attribute "foo"')
    t.end()
  })

  test("getAttribute()", (t) => {
    const el = DefaultDOMElement.parseSnippet('<div foo="1">TEST</div>', 'html')
    t.equal(el.getAttribute('foo'), "1", 'should have return attribute "foo"')
    t.end()
  })

  test("setAttribute()", (t) => {
    let doc = DefaultDOMElement.createDocument('html')
    const el = doc.createElement('div')
    el.setAttribute('foo', 1)
    t.equal(el.getAttribute('foo'), "1", 'should have set attribute')
    t.end()
  })

  test("removeAttribute()", (t) => {
    const el = DefaultDOMElement.parseSnippet('<div foo="1">TEST</div>', 'html')
    el.removeAttribute('foo')
    t.isNil(el.getAttribute('foo'), 'should removed attribute')
    t.end()
  })

  test("attr() - getter", (t) => {
    const el = DefaultDOMElement.parseSnippet('<div foo="1">TEST</div>', 'html')
    t.equal(el.attr('foo'), "1", 'should return attribute value')
    t.end()
  })

  test("attr() - single attribute", (t) => {
    let doc = DefaultDOMElement.createDocument('html')
    const el = doc.createElement('div')
    el.attr('foo', 1)
    t.equal(el.getAttribute('foo'), "1", 'should have set attribute')
    t.end()
  })

  test("attr() - multiple attributes", (t) => {
    let doc = DefaultDOMElement.createDocument('html')
    const el = doc.createElement('div')
    el.attr({
      foo: 1,
      bar: 2
    })
    t.equal(el.getAttribute('foo'), "1", 'should have set attribute')
    t.equal(el.getAttribute('bar'), "2", 'should have set attribute')
    t.end()
  })

  test("removeAttr() - single attribute", (t) => {
    const el = DefaultDOMElement.parseSnippet('<div foo="1">TEST</div>', 'html')
    el.removeAttr('foo')
    t.isNil(el.getAttribute('foo'), 'should removed attribute')
    t.end()
  })

  test("removeAttr() - multiple attributes", (t) => {
    const el = DefaultDOMElement.parseSnippet('<div foo="1" bar="2">TEST</div>', 'html')
    el.removeAttr('foo bar')
    t.isNil(el.getAttribute('foo'), 'should removed attribute')
    t.isNil(el.getAttribute('bar'), 'should removed attribute')
    t.end()
  })

  test("getAttributes()", (t) => {
    const el = DefaultDOMElement.parseSnippet('<div foo="1" bar="2">TEST</div>', 'html')
    const attributes = el.getAttributes()
    t.deepEqual(Array.from(attributes.entries()), [["foo", '1'], ["bar", '2']], 'should return all attributes')
    t.deepEqual(Array.from(attributes.keys()), ["foo", "bar"], '.. keys() are correct')
    t.deepEqual(Array.from(attributes.values()), ['1', '2'], '.. values() are correct')
    t.end()
  })

  test("getProperty()", (t) => {
    const el = DefaultDOMElement.parseSnippet('<input type="text" value="foo">', 'html')
    t.equal(el.getProperty('value'), "foo", 'should have correct value')
    t.end()
  })

  test("getProperty() -- input[type=checkbox]", (t) => {
    const el = DefaultDOMElement.parseSnippet('<input type="checkbox" checked>', 'html')
    t.equal(el.getProperty('value'), 'on', 'should have correct value')
    t.equal(el.getProperty('checked'), true, 'should have correct "checked" property')
    t.end()
  })

  test("setProperty()", (t) => {
    let doc = DefaultDOMElement.createDocument('html')
    const el = doc.createElement('input')
    el.setProperty('value', 1)
    t.equal(el.getProperty('value'), "1", 'should have set property')
    t.end()
  })

  test("setProperty() on XML element is not allowed", (t) => {
    let doc = DefaultDOMElement.createDocument('xml')
    const el = doc.createElement('foo')
    t.throws(()=>{
      el.setProperty('bar', 1)
    }, 'setProperty() on XML element is not allowed')
    t.end()
  })

  test("unsetting a property", (t) => {
    let doc = DefaultDOMElement.createDocument('html')
    const el = doc.createElement('div')
    el.setProperty('foo', 1)
    el.setProperty('foo', undefined)
    t.isNil(el.getProperty('foo'), 'should have unset property')
    t.end()
  })

  test("htmlProp() -- getter", (t) => {
    const el = DefaultDOMElement.parseSnippet('<input type="text" value="foo">', 'html')
    t.equal(el.htmlProp('value'), "foo", 'should return value')
    t.end()
  })

  test("htmlProp() -- single property", (t) => {
    let doc = DefaultDOMElement.createDocument('html')
    const el = doc.createElement('input')
    el.htmlProp('value', 1)
    t.equal(el.getProperty('value'), "1", 'should have set property')
    t.end()
  })

  test("htmlProp() -- multiple properties", (t) => {
    let doc = DefaultDOMElement.createDocument('html')
    const el = doc.createElement('input')
    el.htmlProp({
      'value': 1,
      'foo': 'foo'
    })
    t.equal(el.getProperty('value'), "1", 'should have set property')
    t.equal(el.getProperty('foo'), "foo", 'should have set property')
    t.end()
  })

  test("getValue()", (t) => {
    const el = DefaultDOMElement.parseSnippet('<input type="text" value="foo">', 'html')
    t.equal(el.getValue(), "foo", 'should have correct value')
    t.equal(el.val(), "foo", 'should work via jquery style getter')
    t.equal(el.value, "foo", 'should work via property getter')
    t.end()
  })

  test("setValue()", (t) => {
    let doc = DefaultDOMElement.createDocument('html')
    const el = doc.createElement('input')
    el.setValue(1)
    t.equal(el.getValue(), "1", 'should have set value')
    el.value = 2
    t.equal(el.value, "2", 'should also work via property accessors')
    el.val(3)
    t.equal(el.value, "3", 'should also work via jquery style setter')
    t.end()
  })

  test("getStyle()", (t) => {
    let el = DefaultDOMElement.parseSnippet('<div style="color:blue"></div>', 'html')
    t.equal(el.getStyle('color'), 'blue', 'element should have style')
    t.equal(el.getAttribute('style'), 'color:blue', 'style can be retrieved via "style" attribute')
    t.end()
  })

  test("setStyle()", (t) => {
    let doc = DefaultDOMElement.createDocument('html')
    let el = doc.createElement('div')
    el.setStyle('color', 'blue')
    t.equal(el.getStyle('color'), 'blue', 'element should have style set')
    el.setAttribute('style', 'color:green')
    t.equal(el.getStyle('color'), 'green', 'style can be set via attribute "style" too')
    t.end()
  })

  test("setStyle() -- px styles", (t) => {
    let doc = DefaultDOMElement.createDocument('html')
    let el = doc.createElement('div')
    el.css({
      top: 10,
      bottom: 11,
      left: 12,
      right: 13,
      height: 100,
      width: 50
    })
    t.equal(el.getStyle('top'), '10px', 'px should have been added automatically')
    t.equal(el.getStyle('bottom'), '11px', 'px should have been added automatically')
    t.equal(el.getStyle('left'), '12px', 'px should have been added automatically')
    t.equal(el.getStyle('right'), '13px', 'px should have been added automatically')
    t.equal(el.getStyle('height'), '100px', 'px should have been added automatically')
    t.equal(el.getStyle('width'), '50px', 'px should have been added automatically')
    t.end()
  })

  test("css()", (t) => {
    let el = DefaultDOMElement.parseSnippet('<div style="color:blue"></div>', 'html')
    t.equal(el.css('color'), 'blue', 'can access style via jquery style getter')
    el.css('color', 'green')
    t.equal(el.getStyle('color'), 'green', 'can change style via jquery style setter')
    el.css({
      color: 'red',
      background: 'orange'
    })
    t.deepEqual([el.getStyle('color'), el.getStyle('background')], ['red', 'orange'], 'can change multiple styles at once via jquery style setter')
    t.end()
  })

  test("setTextContent", (t) => {
    let doc = DefaultDOMElement.createDocument('html')
    let el = doc.createElement('div')
    el.setTextContent('foo')
    t.equal(el.getTextContent(), 'foo', 'text content should have been set')
    el.textContent = 'bar'
    t.equal(el.getTextContent(), 'bar', 'should work also via property setter')
    el.text('baz')
    t.equal(el.getTextContent(), 'baz', 'should work also via jquery style setter')
    t.end()
  })

  test("innerHTML", (t) => {
    let el = DefaultDOMElement.parseSnippet('<p>abc<span class="foo" data-foo="foo">TEST</span>def</p>', 'html')
    t.equal(el.innerHTML, 'abc<span class="foo" data-foo="foo">TEST</span>def', 'el.innerHTML should give the HTML of the childNodes')
    el.innerHTML = 'TEST'
    t.equal(el.innerHTML, 'TEST', 'setting innerHTML should replace the content')
    t.end()
  })

  test("innerHTML on XML", (t) => {
    let el = DefaultDOMElement.parseSnippet('<foo>abc<bar bla="foo" blupp="foo">TEST</bar>def</foo>', 'xml')
    t.equal(el.innerHTML, 'abc<bar bla="foo" blupp="foo">TEST</bar>def', 'el.innerHTML should give the XML of the element content')
    el.innerHTML = 'TEST'
    t.equal(el.innerHTML, 'TEST', 'setting innerHTML should replace the content')
    t.end()
  })

  test("html()", (t) => {
    let el = DefaultDOMElement.parseSnippet('<div>TEST</div>', 'html')
    t.equal(el.html(), 'TEST', 'should return innerHTML')
    el.html('<span>FOO</span>')
    t.equal(el.innerHTML, '<span>FOO</span>', 'should have set innerHTML')
    t.end()
  })

  test("outerHTML", function(t) {
    var p = DefaultDOMElement.parseSnippet('<p class="foo">TEST</p>', 'html')
    t.equal(p.outerHTML, '<p class="foo">TEST</p>', 'outerHTML should be complete')
    t.end()
  })

  test("outerHTML of XML with camelCase tagnames", function(t) {
    let el = DefaultDOMElement.parseSnippet('<dummy><myNode></myNode></dummy>', 'xml')
    t.equal(el.outerHTML, '<dummy><myNode/></dummy>', 'XML tags should be serialized preserving case.')
    t.end()
  })

  test("find via tagname", function(t) {
    let el = DefaultDOMElement.parseSnippet('<dummy><foo></foo></dummy>', 'xml')
    let foo = el.find('foo')
    t.notNil(foo, 'Should find a <foo> element')
    t.end()
  })

  test("find multiple elements", function(t) {
    let el = DefaultDOMElement.parseSnippet('<dummy><foo>Bla</foo><foo>Blupp</foo></dummy>', 'xml')
    let foos = el.findAll('foo')
    t.equal(foos.length, 2, 'Should find two <foo> elements')
    t.equal(foos[0].textContent, 'Bla', '... with correct textContent')
    t.equal(foos[1].textContent, 'Blupp', '... with correct textContent')
    t.end()
  })

  test("find via #id", function(t) {
    let el = DefaultDOMElement.parseSnippet('<dummy><bla id="foo"></bla></dummy>', 'xml')
    let foo = el.find('#foo')
    t.notNil(foo, 'Should find a #foo element')
    t.end()
  })

  test("find via attr", function(t) {
    let el = DefaultDOMElement.parseSnippet('<dummy><bla data-id="foo"></bla></dummy>', 'xml')
    let foo = el.find('[data-id=foo]')
    t.notNil(foo, 'Should find a element with data-id=foo')
    t.end()
  })

  test("find in XML with camelCase tagnames", function(t) {
    let el = DefaultDOMElement.parseSnippet('<dummy><myNode myValue="foo"></myNode></dummy>', 'xml')
    t.notNil(el.find('myNode'), 'Should find a <myNode> element')
    t.notNil(el.find('[myValue="foo"]'), 'Should find a [myValue] element')
    t.end()
  })

  test("find in XML with namespace tagnames", function(t) {
    let xmlDoc = DefaultDOMElement.parseXML('<dummy xmlns:foo="foo"><foo:myNode></foo:myNode></dummy>')
    let myNode = xmlDoc.find('myNode')
    t.notNil(myNode, 'Should find a <foo:myNode> element')
    t.equal(myNode.tagName, 'foo:myNode', 'tagName should be qualified')
    t.end()
  })

  test("insertAt", function(t) {
    let dummy = DefaultDOMElement.parseSnippet('<dummy><bla></bla></dummy>', 'xml')
    let doc = dummy.getOwnerDocument()
    let newChild = doc.createElement('blupp')
    dummy.insertAt(1, newChild)
    t.equal(dummy.getChildCount(), 2, 'There should be 2 children now')
    t.ok(dummy.getChildAt(0).is('bla'), '.. the first should be <bla>')
    t.ok(dummy.getChildAt(1).is('blupp'), '.. the second should be <blupp>')
    t.end()
  })

  test("reattaching an element via insertAt", function(t) {
    let dummy = DefaultDOMElement.parseSnippet('<dummy><bla><blupp></blupp></bla></dummy>', 'xml')
    let blupp = dummy.find('blupp')
    dummy.insertAt(0, blupp)
    t.equal(dummy.getChildCount(), 2, 'There should be 2 children now')
    t.ok(dummy.getChildAt(0).is('blupp'), '.. the first should be <blupp>')
    t.ok(dummy.getChildAt(1).is('bla'), '.. the second should be <bla>')
    t.equal(dummy.getChildAt(1).getChildCount(), 0, '.. and <bla> should have no children')
    t.end()
  })

  test("reattaching an element via append", function(t) {
    let dummy = DefaultDOMElement.parseSnippet('<dummy><bla><blupp></blupp></bla></dummy>', 'xml')
    let blupp = dummy.find('blupp')
    dummy.appendChild(blupp)
    t.equal(dummy.getChildCount(), 2, 'There should be 2 children now')
    t.ok(dummy.getChildAt(0).is('bla'), '.. the first should be <bla>')
    t.ok(dummy.getChildAt(1).is('blupp'), '.. the second should be <blupp>')
    t.equal(dummy.getChildAt(0).getChildCount(), 0, '.. and <bla> should have no children')
    t.end()
  })

  test("children should only include elements", function(t) {
    let dummy = DefaultDOMElement.parseSnippet('<dummy>bli<bla></bla>blupp</dummy>', 'xml')
    dummy.children.forEach((c)=>{
      t.ok(c.isElementNode(), 'child should be an element')
    })
    t.end()
  })

  test("event listeners for custom events", (t) => {
    let doc = DefaultDOMElement.createDocument('html')
    let el = doc.createElement('div')
    let event = null
    let handleFoo = function(e) {
      event = e
    }
    el.addEventListener('foo', handleFoo)
    t.deepEqual(el.getEventListeners().map(l=>l.eventName), ['foo'], 'Element should have one listener')
    el.emit('foo', { bar: 'bar' })
    t.notNil(event, 'should have handled event')
    t.notNil(event.detail, 'event should have event.detail')
    t.deepEqual(event.detail, { bar: 'bar' })
    el.removeEventListener('foo', handleFoo)
    t.equal(el.getEventListeners().length, 0, 'element should not have a listener anymore')
    event = null
    el.emit('foo', { baz: 'baz' })
    t.nil(event, 'event handler should not be called this time')
    t.end()
  })

  test("getChildNodes()", (t) => {
    let el = DefaultDOMElement.parseSnippet('<p>Foo<span>Bar</span>Baz</p>', 'html')
    let childNodes = el.childNodes
    t.deepEqual(childNodes.map(c => c.nodeType), ['text', 'element', 'text'], "should return all childNodes")
    t.end()
  })

  test("getChildren()", (t) => {
    let el = DefaultDOMElement.parseSnippet('<p>Foo<span>Bar</span>Baz</p>', 'html')
    let children = el.children
    t.deepEqual(children.map(c => c.tagName), ['span'], "should return all children")
    t.end()
  })

  test("firstChild", (t) => {
    let el = DefaultDOMElement.parseSnippet('<p>Foo<span>Bar</span>Baz</p>', 'html')
    let firstChild = el.firstChild
    t.equal(firstChild.textContent, 'Foo', "should return all firstChild")
    t.end()
  })

  test("lastChild", (t) => {
    let el = DefaultDOMElement.parseSnippet('<p>Foo<span>Bar</span>Baz</p>', 'html')
    let lastChild = el.lastChild
    t.equal(lastChild.textContent, 'Baz', "should return all lastChild")
    t.end()
  })

  test("is()", (t) => {
    let doc = DefaultDOMElement.createDocument('html')
    let el = doc.createElement('div').attr('data-id', 'foo')
    t.ok(el.is('div[data-id=foo]'))
    t.notOk(el.is('foo'))
    t.end()
  })

  test("getOwnerDocument()", (t) => {
    let doc = DefaultDOMElement.createDocument('html')
    let el = doc.createElement('div')
    t.equal(el.getOwnerDocument(), doc, 'should return the ownerDocument')
    t.equal(el.ownerDocument, doc, 'should also work via property getter')
    t.end()
  })

  test('#1075: HTML encoding', function (t) {
    let el = DefaultDOMElement.createDocument('html').createElement('pre')

    el.text('Less than < char')
    t.equal(el.text(), 'Less than < char')

    el.html('Less than < char')
    t.equal(el.html(), 'Less than &lt; char')

    el.text('Less than &lt; char')
    t.equal(el.text(), 'Less than &lt; char')

    el.html('Less than &lt; char')
    t.equal(el.html(), 'Less than &lt; char')

    t.end()
  })

}
