'use strict';

require('../qunit_extensions');
var TestHTMLExporter = require('../../model/TestHTMLExporter');
var TestArticle = require('../../model/TestArticle');
var simpleDoc = require('../../fixtures/simple');

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

QUnit.test("Exporting paragraph with strong", function(assert) {
  var p1 = doc.create({ type: 'paragraph', id: 'p1', content: CONTENT });
  doc.create({ type: 'strong', id: 's1', path: ['p1', 'content'], startOffset: 4, endOffset: 7});
  var el = exporter.convertNode(p1);
  var actual = el.outerHTML;
  var expected = '<p data-id="p1">0123<strong data-id="s1">456</strong>789</p>';
  assert.equal(expected, actual);
});

QUnit.test("Exporting h1", function(assert) {
  var h1 = doc.create({ type: 'heading', id: 'h1', level: 1, content: CONTENT });
  var el = exporter.convertNode(h1);
  var actual = el.outerHTML;
  var expected = '<h1 data-id="h1">' + CONTENT + '</h1>';
  assert.equal(expected, actual);
});

QUnit.test("Exporting h2", function(assert) {
  var h2= doc.create({ type: 'heading', id: 'h2', level: 2, content: CONTENT });
  var el = exporter.convertNode(h2);
  var actual = el.outerHTML;
  var expected = '<h2 data-id="h2">' + CONTENT + '</h2>';
  assert.equal(expected, actual);
});

QUnit.test("Exporting simple document", function(assert) {
  var doc = simpleDoc();
  var actual = exporter.exportDocument(doc);
  var expected = [
    '<p data-id="p1">' + CONTENT + '</p>',
    '<p data-id="p2">' + CONTENT + '</p>',
    '<p data-id="p3">' + CONTENT + '</p>',
    '<p data-id="p4">' + CONTENT + '</p>'
  ].join('');
  assert.equal(expected, actual);
});
