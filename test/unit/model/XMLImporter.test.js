'use strict';

require('../qunit_extensions');
var TestXMLImporter = require('../../model/TestXMLImporter');
var DOMElement = require('../../../ui/DefaultDOMElement');

var importer;

QUnit.module('model/XMLImporter', {
  beforeEach: function() {
    importer = new TestXMLImporter();
  },
  afterEach: function() {
    importer = null;
  }
});

var CONTENT = '0123456789';

QUnit.test("Importing paragraph", function(assert) {
  var xml = '<p data-id="p1">' + CONTENT + '</p>';
  var el = DOMElement.parseXML(xml);
  var node = importer.convertElement(el);
  assert.deepEqual(node, {
    id: "p1",
    type: "paragraph",
    content: CONTENT
  });
});

QUnit.test("Importing paragraph with strong", function(assert) {
  var xml = '<p data-id="p1">0123<strong data-id="s1">456</strong>789</p>';
  var el = DOMElement.parseXML(xml);
  importer.convertElement(el);
  var doc = importer.generateDocument();
  var p1 = doc.get('p1');
  var s1 = doc.get('s1');
  assert.equal(CONTENT, p1.content);
  assert.equal('456', s1.getText());
});

QUnit.test("Importing h1", function(assert) {
  var xml = '<h1 data-id="h1">' + CONTENT + '</h1>';
  var el = DOMElement.parseXML(xml);
  var node = importer.convertElement(el);
  assert.deepEqual(node, {
    id: "h1",
    type: "heading",
    level: 1,
    content: CONTENT
  });
});

QUnit.test("Importing h2", function(assert) {
  var xml = '<h2 data-id="h2">' + CONTENT + '</h2>';
  var el = DOMElement.parseXML(xml);
  var node = importer.convertElement(el);
  assert.deepEqual(node, {
    id: "h2",
    type: "heading",
    level: 2,
    content: CONTENT
  });
});

QUnit.test("Importing meta", function(assert) {
  var xml = '<meta><title>' + CONTENT + '</title></meta>';
  var el = DOMElement.parseXML(xml);
  var node = importer.convertElement(el);

  assert.deepEqual(node, {
    id: 'meta',
    type: 'meta',
    title: CONTENT
  });
});
