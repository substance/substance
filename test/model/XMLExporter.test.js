'use strict';

require('../QUnitExtensions');
var TestXMLExporter = require('../model/TestXMLExporter');
var TestArticle = require('../model/TestArticle');
var simpleDoc = require('../fixtures/simple');

var exporter;
var doc;

QUnit.module('model/XMLExporter', {
  beforeEach: function() {
    exporter = new TestXMLExporter();
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
  var actual = el.serialize();
  var expected = '<p id="p1">' + CONTENT + '</p>';
  assert.equal(actual, expected);
});

QUnit.test("Exporting paragraph with strong", function(assert) {
  var p1 = doc.create({ type: 'paragraph', id: 'p1', content: CONTENT });
  doc.create({ type: 'strong', id: 's1', path: ['p1', 'content'], startOffset: 4, endOffset: 7});
  var el = exporter.convertNode(p1);
  var actual = el.serialize();
  var expected = '<p id="p1">0123<strong id="s1">456</strong>789</p>';
  assert.equal(actual, expected);
});

QUnit.test("Exporting h1", function(assert) {
  var h1 = doc.create({ type: 'heading', id: 'h1', level: 1, content: CONTENT });
  var el = exporter.convertNode(h1);
  var actual = el.serialize();
  var expected = '<h1 id="h1">' + CONTENT + '</h1>';
  assert.equal(actual, expected);
});

QUnit.test("Exporting h2", function(assert) {
  var h2= doc.create({ type: 'heading', id: 'h2', level: 2, content: CONTENT });
  var el = exporter.convertNode(h2);
  var actual = el.serialize();
  var expected = '<h2 id="h2">' + CONTENT + '</h2>';
  assert.equal(actual, expected);
});

QUnit.test("Exporting simple document", function(assert) {
  var doc = simpleDoc();
  var rootEl = exporter.exportDocument(doc);
  var actual = rootEl.serialize();
  var expected = [
    '<article>',
    '<p id="p1">' + CONTENT + '</p>',
    '<p id="p2">' + CONTENT + '</p>',
    '<p id="p3">' + CONTENT + '</p>',
    '<p id="p4">' + CONTENT + '</p>',
    '</article>'
  ].join('');
  assert.equal(expected, actual);
});

QUnit.test("Exporting meta", function(assert) {
  var meta = doc.get('meta');
  var el = exporter.convertNode(meta);
  var actual = el.serialize();
  var expected = '<meta id="meta"><title>Untitled</title></meta>';
  assert.equal(actual, expected);
  assert.ok(true);
});

QUnit.test("Exporting image", function(assert) {
  var data = { type: 'image', id: 'img1', 'src': 'img1.png', 'previewSrc': 'img1preview.png' };
  var img = doc.create(data);
  var el = exporter.convertNode(img);
  assert.equal(el.tagName.toLowerCase(), 'image');
  assert.equal(el.id, 'img1');
  assert.equal(el.getAttribute('src'), 'img1.png');
});
