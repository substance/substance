var twoParagraphs = require('./two-paragraphs');

// Fixture for backend
var testSeed = {
  users: {
    'test': {
      userId: 'test',
      name: 'Test user',
      loginKey: '1234'
    }
  },
  changesets: {
    'test-doc': twoParagraphs.createChangeset()
  }
};

module.exports = testSeed;