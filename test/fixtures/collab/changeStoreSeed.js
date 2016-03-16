var twoParagraphs = require('./two-paragraphs');
var insertText = require('./insertText');

var testDoc = twoParagraphs.createArticle();
var insertTextChange1 = insertText(testDoc, 1, '!');
var insertTextChange2 = insertText(testDoc, 3, '???');

var changeStoreSeed = {
  'test-doc': twoParagraphs.createChangeset(),
  'test-doc-2': twoParagraphs.createChangeset().concat([insertTextChange1, insertTextChange2])
};

module.exports = changeStoreSeed;