'use strict';

var test = require('../test').module('model/XMLImporter');

var TestXMLImporter = require('../model/TestXMLImporter');
var DOMElement = require('../../ui/DefaultDOMElement');

var importer;

function setup() {
  importer = new TestXMLImporter();
}

function teardown() {
  importer = null;
}

function setupTest(description, fn) {
  test(description, function (t) {
    setup();
    fn(t);
    teardown();
  });
}

var CONTENT = '0123456789';

setupTest("Importing paragraph", function(t) {
  var xml = '<p id="p1">' + CONTENT + '</p>';
  var el = DOMElement.parseXML(xml);
  var node = importer.convertElement(el);
  t.deepEqual(node.toJSON(), {
    id: "p1",
    type: "paragraph",
    content: CONTENT
  });
  t.end();
});

setupTest("Importing paragraph with strong", function(t) {
  var xml = '<p id="p1">0123<strong id="s1">456</strong>789</p>';
  var el = DOMElement.parseXML(xml);
  importer.convertElement(el);
  var doc = importer.generateDocument();
  var p1 = doc.get('p1');
  var s1 = doc.get('s1');
  t.equal(CONTENT, p1.content);
  t.equal('456', s1.getText());
  t.end();
});

setupTest("Importing h1", function(t) {
  var xml = '<h1 id="h1">' + CONTENT + '</h1>';
  var el = DOMElement.parseXML(xml);
  var node = importer.convertElement(el);
  t.deepEqual(node.toJSON(), {
    id: "h1",
    type: "heading",
    level: 1,
    content: CONTENT
  });
  t.end();
});

setupTest("Importing h2", function(t) {
  var xml = '<h2 id="h2">' + CONTENT + '</h2>';
  var el = DOMElement.parseXML(xml);
  var node = importer.convertElement(el);
  t.deepEqual(node.toJSON(), {
    id: "h2",
    type: "heading",
    level: 2,
    content: CONTENT
  });
  t.end();
});

setupTest("Importing meta", function(t) {
  var xml = '<meta><title>' + CONTENT + '</title></meta>';
  var el = DOMElement.parseXML(xml);
  var node = importer.convertElement(el);

  t.deepEqual(node.toJSON(), {
    id: 'meta',
    type: 'meta',
    title: CONTENT
  });
  t.end();
});

setupTest("Importing image", function(t) {
  var xml = '<image id="img1" src="someimage.png" preview-src="someimagepreview.png"/>';
  var el = DOMElement.parseXML(xml);
  var node = importer.convertElement(el);
  t.deepEqual(node.toJSON(), {
    id: 'img1',
    type: 'image',
    src: 'someimage.png',
    previewSrc: 'someimagepreview.png'
  });
  t.end();
});
