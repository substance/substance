'use strict';

var TestArticle = require('../model/TestArticle');

/*
  Creates an empty test document with the following content
*/
module.exports = function empty() {
  return new TestArticle();
};
