'use strict';

require('../qunit_extensions');

var TestHTMLImporter = require('../../test_article/TestHTMLImporter');
var DOMElement = require('../../../ui/DefaultDOMElement');

var importer;

QUnit.module('model/HTMLImporter', {
  beforeEach: function() {
    importer = new TestHTMLImporter();
  },
  afterEach: function() {
    importer = null;
  }
});

function parseHtmlElement(html) {
  var docEl = DOMElement.parseHtml(html);
  return docEl.find('body').children[0];
}

var CONTENT = '0123456789';

QUnit.test("Importing paragraph", function(assert) {
  var html = '<p data-id="p1">' + CONTENT + '</p>';
  var el = parseHtmlElement(html);
  var node = importer.convertElement(el);
  assert.deepEqual(node, {
    id: "p1",
    type: "paragraph",
    content: CONTENT
  });
});

QUnit.test("Importing paragraph with strong", function(assert) {
  var html = '<p data-id="p1">0123<strong data-id="s1">456</strong>789</p>';
  var doc = importer.importDocument(html);
  assert.equal(CONTENT, doc.get(['p1', 'content']));
});

QUnit.test("Importing h1", function(assert) {
  var html = '<h1 data-id="h1">' + CONTENT + '</h1>';
  var el = parseHtmlElement(html);
  var node = importer.convertElement(el);
  assert.deepEqual(node, {
    id: "h1",
    type: "heading",
    level: 1,
    content: CONTENT
  });
});

QUnit.test("Importing h2", function(assert) {
  var html = '<h2 data-id="h2">' + CONTENT + '</h2>';
  var el = parseHtmlElement(html);
  var node = importer.convertElement(el);
  assert.deepEqual(node, {
    id: "h2",
    type: "heading",
    level: 2,
    content: CONTENT
  });
});
