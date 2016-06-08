'use strict';

var test = require('../test');

var TestXMLExporter = require('../model/TestXMLExporter');
var TestArticle = require('../model/TestArticle');

var fixture = require('../fixtures/createTestArticle');
var simple = require('../fixtures/simple');

var exporter;
var doc;

function setup() {
  exporter = new TestXMLExporter();
  doc = new TestArticle();
};

function teardown() {
  exporter = null;
};

function setupTest(description, fn) {
  test(description, function (t) {
    setup();
    fn(t);
    teardown();
  });
};

var CONTENT = '0123456789';

setupTest("Exporting paragraph", function(t) {
  var p1 = doc.create({ type: 'paragraph', id: 'p1', content: CONTENT });
  var el = exporter.convertNode(p1);
  var actual = el.serialize();
  var expected = '<p id="p1">' + CONTENT + '</p>';
  t.equal(actual, expected);
  t.end();
});

setupTest("Exporting paragraph with strong", function(t) {
  var p1 = doc.create({ type: 'paragraph', id: 'p1', content: CONTENT });
  doc.create({ type: 'strong', id: 's1', path: ['p1', 'content'], startOffset: 4, endOffset: 7});
  var el = exporter.convertNode(p1);
  var actual = el.serialize();
  var expected = '<p id="p1">0123<strong id="s1">456</strong>789</p>';
  t.equal(actual, expected);
  t.end();
});

setupTest("Exporting h1", function(t) {
  var h1 = doc.create({ type: 'heading', id: 'h1', level: 1, content: CONTENT });
  var el = exporter.convertNode(h1);
  var actual = el.serialize();
  var expected = '<h1 id="h1">' + CONTENT + '</h1>';
  t.equal(actual, expected);
  t.end();
});

setupTest("Exporting h2", function(t) {
  var h2= doc.create({ type: 'heading', id: 'h2', level: 2, content: CONTENT });
  var el = exporter.convertNode(h2);
  var actual = el.serialize();
  var expected = '<h2 id="h2">' + CONTENT + '</h2>';
  t.equal(actual, expected);
  t.end();
});

setupTest("Exporting simple document", function(t) {
  var doc = fixture(simple);
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
  t.equal(expected, actual);
  t.end();
});

setupTest("Exporting meta", function(t) {
  var meta = doc.get('meta');
  var el = exporter.convertNode(meta);
  var actual = el.serialize();
  var expected = '<meta id="meta"><title>Untitled</title></meta>';
  t.equal(actual, expected);
  t.ok(true);
  t.end();
});

setupTest("Exporting image", function(t) {
  var data = { type: 'image', id: 'img1', 'src': 'img1.png', 'previewSrc': 'img1preview.png' };
  var img = doc.create(data);
  var el = exporter.convertNode(img);
  t.equal(el.tagName.toLowerCase(), 'image');
  t.equal(el.id, 'img1');
  t.equal(el.getAttribute('src'), 'img1.png');
  t.end();
});
