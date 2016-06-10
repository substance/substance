'use strict';

var TestArticle = require('../model/TestArticle');
var createChangeset = require('./createChangeset');
var twoParagraphs = require('./twoParagraphs');
var insertText = require('./insertText');

var changeset1 = createChangeset(new TestArticle(), twoParagraphs);
var changeset2 = createChangeset(new TestArticle(), function(tx) {
  twoParagraphs(tx);
  insertText(tx, {
    path: ['p1', 'content'],
    pos: 1,
    text: '!'
  });
  insertText(tx, {
    path: ['p1', 'content'],
    pos: 3,
    text: '???'
  });
});

var changeStoreSeed = {
  'test-doc': changeset1,
  'test-doc-2': changeset2
};

module.exports = changeStoreSeed;