var twoParagraphs = require('./two-paragraphs');

// Fixture for backend
var testSeed = {
  users: {
    'user1': {
      userId: 'user1',
      name: 'User 1'
    },
    'user2': {
      userId: 'user1',
      name: 'User 2'
    }
  },
  documents: {
    'test-doc': {
      schema: {
        name: 'prose-article',
        version: '1.0.0'
      },
      changes: twoParagraphs.createChangeset()
    }
  },
  sessions: {
    'user1token': {
      'userId': 'user1',
      'sessionToken': 'user1token'
    },
    'user2token': {
      'userId': 'user2',
      'sessionToken': 'user2token'
    }
  }
};

module.exports = testSeed;