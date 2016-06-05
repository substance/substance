'use strict';

require('../QUnitExtensions');
var DOMElement = require('../../ui/DefaultDOMElement');

QUnit.module('ui/DOMElement');

QUnit.test("Parsing a full HTML document", function(assert) {
  var html = '<html><head><title>TEST</title></head><body>TEST</body></html>';
  var doc = DOMElement.parseHTML(html);
  var head = doc.find('head');
  assert.isDefinedAndNotNull(head);

  var title = head.find('title');
  assert.isDefinedAndNotNull(title);
  assert.equal(title.text(), 'TEST');

  var body = doc.find('body');
  assert.isDefinedAndNotNull(body);
  assert.equal(body.text(), 'TEST');
});

QUnit.test("Parsing one HTML element", function(assert) {
  var html = '<p>TEST</p>';
  var p = DOMElement.parseHTML(html);
  assert.isDefinedAndNotNull(p);
  assert.equal(p.tagName, 'p');
  assert.equal(p.text(), 'TEST');
});

QUnit.test("Parsing multiple HTML elements", function(assert) {
  var html = '<p>TEST</p><p>TEST2</p>';
  var els = DOMElement.parseHTML(html);
  assert.equal(els.length, 2);
  assert.equal(els[0].tagName, 'p');
  assert.equal(els[0].text(), 'TEST');
  assert.equal(els[1].tagName, 'p');
  assert.equal(els[1].text(), 'TEST2');
});

QUnit.test("Parsing annotated HTML text", function(assert) {
  var html = '123<b>456</b>789';
  var els = DOMElement.parseHTML(html);
  assert.equal(els.length, 3, 'there are three elements');
  assert.equal(els[0].nodeType, 'text', 'first is a text node');
  assert.equal(els[0].text(), '123', '... it has correct content');
  assert.equal(els[1].nodeType, 'element', 'second is an element');
  assert.equal(els[1].tagName, 'b', '... it is a <b>');
  assert.equal(els[1].text(), '456', '... it has correct content');
  assert.equal(els[2].nodeType, 'text', 'third is a text node again');
  assert.equal(els[2].text(), '789', '... it has correct content');
});

QUnit.test("Parsing an XML document", function(assert) {
  var xml = "<mydoc><myhead><mytitle>TEST</mytitle></myhead><mybody>TEST</mybody></mydoc>";
  var doc = DOMElement.parseXML(xml);
  var head = doc.find('myhead');
  assert.isDefinedAndNotNull(head);

  var title = head.find('mytitle');
  assert.isDefinedAndNotNull(title);
  assert.equal(title.text(), 'TEST');

  var body = doc.find('mybody');
  assert.isDefinedAndNotNull(body);
  assert.equal(body.text(), 'TEST');
});

QUnit.test("hasClass", function(assert) {
  var p = DOMElement.parseHTML('<p class="foo">TEST</p>');
  assert.ok(p.hasClass('foo'), 'Element should have class "foo".');
});

QUnit.test("addClass", function(assert) {
  var p = DOMElement.parseHTML('<p>TEST</p>');
  p.addClass('foo');
  assert.ok(p.hasClass('foo'), 'Element should have class "foo".');
});

QUnit.test("removeClass", function(assert) {
  var p = DOMElement.parseHTML('<p class="foo">TEST</p>');
  p.removeClass('foo');
  assert.notOk(p.hasClass('foo'), 'Element should not have class "foo".');
});
