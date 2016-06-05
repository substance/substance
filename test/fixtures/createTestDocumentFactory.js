'use strict';

var createTestArticle = require('./createTestArticle');
var createChangeset = require('./createChangeset');

module.exports = function createTestDocumentFactory(seedFn) {
  return {
    createDocument: function() {
      return createTestArticle(seedFn);
    },
    createChangeset: function() {
      var doc = createTestArticle();
      return createChangeset(doc, seedFn);
    }
  };
};
