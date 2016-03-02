var twoParagraphs = require('./two-paragraphs');

// Fixture for backend
var testSeed = {
  users: {
    '1': {
      userId: '1'
    },
    '2': {
      userId: '2'
    }
  },
  documents: {
    'test-doc': {
      documentId: 'test-doc',
      userId: '1',
      schema: {
        name: 'prose-article',
        version: '1.0.0'
      },
      changes: twoParagraphs.createChangeset()
    }
  },
  sessions: {
    'user1token': {
      'userId': '1',
      'sessionToken': 'user1token'
    },
    'user2token': {
      'userId': '2',
      'sessionToken': 'user2token'
    }
  }
};

module.exports = testSeed;