// Fixture for documentStore

var twoParagraphs = require('./two-paragraphs');
var insertText = require('./insertText');
var JSONConverter = require('../model/JSONConverter');
var converter = new JSONConverter();

// Serializes to JSON
function build(doc, documentId, version) {
  return {
    documentId: documentId,
    data: converter.exportDocument(doc),
    version: version,
  };
}

var testDoc = twoParagraphs.createArticle();
var doc1V1 = build(testDoc, 'test-doc', 1);
var doc2V1 = build(testDoc, 'test-doc-2', 1);
insertText(testDoc, 1, '!');
var doc2V2 = build(testDoc, 'test-doc-2', 2);
insertText(testDoc, 3, '???');
var doc2V3 = build(testDoc, 'test-doc-2', 3);

var snapshotStoreSeed = {
  'test-doc': {
    1: doc1V1
  },
  'test-doc-2': {
    1: doc2V1,
    2: doc2V2,
    3: doc2V3
  }
};

module.exports = snapshotStoreSeed;