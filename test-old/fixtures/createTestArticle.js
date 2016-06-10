'use strict';

var TestArticle = require('../model/TestArticle');

module.exports = function createTestArticle(seedFn) {
  var doc = new TestArticle();
  if (seedFn) {
    seedFn(doc);
  }
  return doc;
};
