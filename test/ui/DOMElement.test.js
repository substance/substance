'use strict';

var test = require('../test').module('ui/DOMElement');
var spy = require('../spy');

var DOMElement = require('../../ui/DefaultDOMElement');

test("Parsing a full HTML document", function(t) {
  var html = '<html><head><title>TEST</title></head><body>TEST</body></html>';
  var doc = DOMElement.parseHTML(html);
  var head = doc.find('head');
  t.notNil(head);

  var title = head.find('title');
  t.notNil(title, '<head> should contain <title>');
  t.equal(title.text(), 'TEST');

  var body = doc.find('body');
  t.notNil(body, 'document should have a <body> element.');
  t.equal(body.text(), 'TEST', 'body content should be correct.');
  t.end();
});

test("Parsing one HTML element", function(t) {
  var html = '<p>TEST</p>';
  var p = DOMElement.parseHTML(html);
  t.notNil(p, 'HTML should get parsed.');
  t.equal(p.tagName, 'p', '.. providing one <p> element,');
  t.equal(p.text(), 'TEST', '.. with correct content.');
  t.end();
});


test("Parsing multiple HTML elements", function(t) {
  var html = '<p>TEST</p><p>TEST2</p>';
  var els = DOMElement.parseHTML(html);
  t.notNil(els, 'HTML should get parsed.');
  t.equal(els.length, 2, '.. Providing 2 elements');
  t.equal(els[0].tagName, 'p', '.. the first a <p>');
  t.equal(els[0].text(), 'TEST', '.. with correct content');
  t.equal(els[1].tagName, 'p', '.. the second a <p>');
  t.equal(els[1].text(), 'TEST2', '.. with correct content');
  t.end();
});

test("Parsing annotated HTML text", function(t) {
  var html = '123<b>456</b>789';
  var els = DOMElement.parseHTML(html);
  t.equal(els.length, 3, 'there are three elements');
  t.equal(els[0].nodeType, 'text', 'first is a text node');
  t.equal(els[0].text(), '123', '... it has correct content');
  t.equal(els[1].nodeType, 'element', 'second is an element');
  t.equal(els[1].tagName, 'b', '... it is a <b>');
  t.equal(els[1].text(), '456', '... it has correct content');
  t.equal(els[2].nodeType, 'text', 'third is a text node again');
  t.equal(els[2].text(), '789', '... it has correct content');
  t.end();
});

test("Parsing an XML document", function(t) {
  var xml = "<mydoc><myhead><mytitle>TEST</mytitle></myhead><mybody>TEST</mybody></mydoc>";
  var doc = DOMElement.parseXML(xml);
  var head = doc.find('myhead');
  t.notNil(head);
  var title = head.find('mytitle');
  t.notNil(title, '<head> should contain <title>');
  t.equal(title.text(), 'TEST');
  var body = doc.find('mybody');
  t.notNil(body, 'document should have a <body> element.');
  t.equal(body.text(), 'TEST', 'body content should be correct.');
  t.end();
});

test("hasClass", function(t) {
  var p = DOMElement.parseHTML('<p class="foo">TEST</p>');
  t.ok(p.hasClass('foo'), 'Element should have class "foo".');
  t.end();
});

test("addClass", function(t) {
  var p = DOMElement.parseHTML('<p>TEST</p>');
  p.addClass('foo');
  t.ok(p.hasClass('foo'), 'Element should have class "foo".');
  t.end();
});

test("removeClass", function(t) {
  var p = DOMElement.parseHTML('<p class="foo">TEST</p>');
  p.removeClass('foo');
  t.notOk(p.hasClass('foo'), 'Element should not have class "foo".');
  t.end();
});

test("setTagName", function(t) {
  var el = DOMElement.parseHTML('<p class="foo">ABC<b>DEF</b>GHI</p>');
  var onClick = spy();
  el.on('click', onClick);
  // this call is brutal as a new element needs to be created
  // and all the content and attributes be copied over
  el.setTagName('h1');
  t.equal(el.tagName, 'h1', 'Now the element should be a heading');
  t.equal(el.textContent, 'ABCDEFGHI', '.. its text content should have been preserved');
  t.equal(el.getChildCount(), 3, '.. and its children should still be there');
  t.notNil(el.find('b'), '.. including the <b> element');
  el.click();
  t.equal(onClick.callCount, 1, '.. and even the click handler should still work');
  t.end();
});
