'use strict';

var createTestArticle = require('./createTestArticle');
var createChangeset = require('./createChangeset');

module.exports = function createTestDocumentFactory() {
  return {
    createDocument: function() {
      return createTestArticle();
    },
    createChangeset: function() {
      var doc = createTestArticle();
      return createChangeset(doc);
    }
  };
};
