'use strict';

var test = require('tape');

var TestHTMLExporter = require('../model/TestHTMLExporter');
var TestArticle = require('../model/TestArticle');

var fixture = require('../fixtures/createTestArticle');
var simple = require('../fixtures/simple');

var exporter;
var doc;

function setup() {
  exporter = new TestHTMLExporter();
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
  var actual = el.outerHTML;
  var expected = '<p data-id="p1">' + CONTENT + '</p>';
  t.equal(actual, expected);
  t.end();
});

setupTest("Exporting paragraph with strong", function(t) {
  var p1 = doc.create({ type: 'paragraph', id: 'p1', content: CONTENT });
  doc.create({ type: 'strong', id: 's1', path: ['p1', 'content'], startOffset: 4, endOffset: 7});
  var el = exporter.convertNode(p1);
  var actual = el.outerHTML;
  var expected = '<p data-id="p1">0123<strong data-id="s1">456</strong>789</p>';
  t.equal(actual, expected);
  t.end();
});

setupTest("Exporting h1", function(t) {
  var h1 = doc.create({ type: 'heading', id: 'h1', level: 1, content: CONTENT });
  var el = exporter.convertNode(h1);
  var actual = el.outerHTML;
  var expected = '<h1 data-id="h1">' + CONTENT + '</h1>';
  t.equal(actual, expected);
  t.end();
});

setupTest("Exporting h2", function(t) {
  var h2 = doc.create({ type: 'heading', id: 'h2', level: 2, content: CONTENT });
  var el = exporter.convertNode(h2);
  var actual = el.outerHTML;
  var expected = '<h2 data-id="h2">' + CONTENT + '</h2>';
  t.equal(actual, expected);
  t.end();
});

setupTest("Exporting simple document", function(t) {
  var doc = fixture(simple);
  var rootEl = exporter.exportDocument(doc);
  var body = rootEl.find('body');
  var actual = body.html();
  var expected = [
    '<p data-id="p1">' + CONTENT + '</p>',
    '<p data-id="p2">' + CONTENT + '</p>',
    '<p data-id="p3">' + CONTENT + '</p>',
    '<p data-id="p4">' + CONTENT + '</p>'
  ].join('');
  t.equal(actual, expected);
  t.end();
});

setupTest("Exporting a link", function(t) {
  var p1 = doc.create({ type: 'paragraph', id: 'p1', content: CONTENT });
  doc.create({ type: 'link', id: 'l1', path: ['p1', 'content'], startOffset: 4, endOffset: 7, url: 'foo', title: 'bar' });
  var el = exporter.convertNode(p1);
  var childNodes = el.getChildNodes();
  t.equal(childNodes.length, 3);
  t.equal(childNodes[0].textContent, "0123");
  t.equal(childNodes[1].textContent, "456");
  t.equal(childNodes[2].textContent, "789");
  var a = childNodes[1];
  t.equal(a.attr('data-id'), 'l1');
  t.equal(a.attr('href'), 'foo');
  t.equal(a.attr('title'), 'bar');
  t.end();
});
