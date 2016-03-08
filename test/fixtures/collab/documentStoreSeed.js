var twoParagraphs = require('./two-paragraphs');

// Fixture for backend
var documentStoreSeed = {
  'test-doc': {
    documentId: 'test-doc',
    userId: '1',
    schema: {
      name: 'prose-article',
      version: '1.0.0'
    },
    changes: twoParagraphs.createChangeset()
  }
};

module.exports = documentStoreSeed;