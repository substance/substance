'use strict';

var Article = require('../model/TestArticle');

module.exports = function() {
  var article = new Article();
  article.set(['meta', 'title'], 'Sample1');
  article.create({
    type: 'paragraph',
    id: 'p1',
    content: '0123456789'
  });
  article.create({
    type: 'paragraph',
    id: 'p2',
    content: '0123456789'
  });
  article.create({
    type: 'paragraph',
    id: 'p3',
    content: '0123456789'
  });
  article.create({
    type: 'paragraph',
    id: 'p4',
    content: '0123456789'
  });
  article.create({
    type: 'test-container-anno',
    id: 'a1',
    container: 'main',
    startPath: ['p1', 'content'],
    startOffset: 5,
    endPath: ['p3', 'content'],
    endOffset: 4,
  });
  article.create({
    type: 'strong',
    id: 'a2',
    path: ['p1', 'content'],
    startOffset: 0,
    endOffset: 2,
  });
  var main = article.get('main');
  main.show('p1');
  main.show('p2');
  main.show('p3');
  main.show('p4');
  article.documentDidLoad();
  article.FORCE_TRANSACTIONS = false;
  return article;
};
