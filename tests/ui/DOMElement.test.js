'use strict';

var test = require('tape');

var isNull = require('lodash/isNull');
var isUndefined = require('lodash/isUndefined');

var DOMElement = require('../../ui/DefaultDOMElement');

function isDefinedAndNotNull(t, x, msg) {
  return t.ok(!isNull(x) && !isUndefined(x), msg);
}

test("Parsing a full HTML document", function(t) {
  var html = '<html><head><title>TEST</title></head><body>TEST</body></html>';
  var doc = DOMElement.parseHTML(html);
  var head = doc.find('head');
  isDefinedAndNotNull(t, head);

  var title = head.find('title');
  isDefinedAndNotNull(t, title);
  t.equal(title.text(), 'TEST');

  var body = doc.find('body');
  isDefinedAndNotNull(t, body);
  t.equal(body.text(), 'TEST');
  t.end();
});

test("Parsing one HTML element", function(t) {
  var html = '<p>TEST</p>';
  var p = DOMElement.parseHTML(html);
  isDefinedAndNotNull(t, p);
  t.equal(p.tagName, 'p');
  t.equal(p.text(), 'TEST');
  t.end();
});

test("Parsing multiple HTML elements", function(t) {
  var html = '<p>TEST</p><p>TEST2</p>';
  var els = DOMElement.parseHTML(html);
  t.equal(els.length, 2);
  t.equal(els[0].tagName, 'p');
  t.equal(els[0].text(), 'TEST');
  t.equal(els[1].tagName, 'p');
  t.equal(els[1].text(), 'TEST2');
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
  isDefinedAndNotNull(t, head);

  var title = head.find('mytitle');
  isDefinedAndNotNull(t, title);
  t.equal(title.text(), 'TEST');

  var body = doc.find('mybody');
  isDefinedAndNotNull(t, body);
  t.equal(body.text(), 'TEST');
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
