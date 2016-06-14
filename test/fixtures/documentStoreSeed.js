'use strict';

// Fixture for documentStore
var documentStoreSeed = {
  'test-doc': {
    documentId: 'test-doc',
    schemaName: 'prose-article',
    schemaVersion: '1.0.0',
    version: 1 // document has one change = version 1
  },
  'test-doc-2': {
    documentId: 'test-doc-2',
    schemaName: 'prose-article',
    schemaVersion: '1.0.0',
    version: 3 // document has 3 changes = version 3
  }
};

module.exports = documentStoreSeed;