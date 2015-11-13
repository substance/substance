'use strict';

require('../qunit_extensions');

var TestHtmlImporter = require('../../test_article/TestHtmlImporter');
var DOMElement = require('../../../util/DOMElement');

var importer;

QUnit.module('model/HtmlImporter', {
  beforeEach: function() {
    importer = new TestHtmlImporter();
  },
  afterEach: function() {
    importer = null;
  }
});

function parseHtmlElement(html) {
  var htmlDoc = DOMElement.parseHtmlDocument(html);
  var body = htmlDoc.find('body');
  return body.children[0];
};

var CONTENT = '0123456789';

QUnit.test("Import Paragraph", function(assert) {
  var html = '<p data-id="p1">' + CONTENT + '</p>';
  var el = parseHtmlElement(html);
  var node = importer.convertElement(el);
  assert.deepEqual({
    id: "p1",
    type: "paragraph",
    content: CONTENT
  }, node);
});
