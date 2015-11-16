'use strict';

require('../qunit_extensions');

var TestHTMLExporter = require('../../test_article/TestHTMLExporter');
var TestArticle = require('../../test_article/test_article');

var exporter;
var doc;

QUnit.module('model/HTMLExporter', {
  beforeEach: function() {
    exporter = new TestHTMLExporter();
    doc = new TestArticle();
  },
  afterEach: function() {
    exporter = null;
  }
});

var CONTENT = '0123456789';

QUnit.test("Exporting paragraph", function(assert) {
  var p1 = doc.create({ type: 'paragraph', id: 'p1', content: CONTENT });
  var el = exporter.convertNode(p1);
  var actual = el.outerHTML;
  var expected = '<p data-id="p1">' + CONTENT + '</p>';
  assert.equal(expected, actual);
});

// QUnit.test("Importing paragraph with strong", function(assert) {
//   var html = '<p data-id="p1">0123<strong data-id="s1">456</strong>789</p>';
//   var doc = importer.importDocument(html);
//   assert.equal(CONTENT, doc.get(['p1', 'content']));
// });

// QUnit.test("Importing h1", function(assert) {
//   var html = '<h1 data-id="h1">' + CONTENT + '</h1>';
//   var el = parseHtmlElement(html);
//   var node = importer.convertElement(el);
//   assert.deepEqual(node, {
//     id: "h1",
//     type: "heading",
//     level: 1,
//     content: CONTENT
//   });
// });

// QUnit.test("Importing h2", function(assert) {
//   var html = '<h2 data-id="h2">' + CONTENT + '</h2>';
//   var el = parseHtmlElement(html);
//   var node = importer.convertElement(el);
//   assert.deepEqual(node, {
//     id: "h2",
//     type: "heading",
//     level: 2,
//     content: CONTENT
//   });
// });
