'use strict';

// Fixture for documentStore

var DocumentSession = require('../../model/DocumentSession');
var JSONConverter = require('../../model/JSONConverter');
var createTestArticle = require('./createTestArticle');
var twoParagraphs = require('./twoParagraphs');
var insertText = require('./insertText');
var converter = new JSONConverter();

// Serializes to JSON
function build(doc, documentId, version) {
  return {
    documentId: documentId,
    data: converter.exportDocument(doc),
    version: version,
  };
}

var doc = createTestArticle(twoParagraphs);
var documentSession = new DocumentSession(doc);

var doc1V1 = build(doc, 'test-doc', 1);
var doc2V1 = build(doc, 'test-doc-2', 1);
documentSession.transaction(function(tx) {
  insertText(tx, {
    path: ['p1', 'content'],
    pos: 1,
    text: '!'
  });
});
documentSession.transaction(function(tx) {
  insertText(tx, {
    path: ['p1', 'content'],
    pos: 3,
    text: '???'
  });
});
var doc2V3 = build(doc, 'test-doc-2', 3);

module.exports = {
  'test-doc': {
    1: doc1V1
  },
  'test-doc-2': {
    1: doc2V1,
    3: doc2V3
  }
};
