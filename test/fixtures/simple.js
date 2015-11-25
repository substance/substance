'use strict';

var Article = require('../model/TestArticle');

/*
  Creates a document with the following content

  ```
  main:
    p1: '0123456789'
    p2: '0123456789'
    p3: '0123456789'
    p4: '0123456789'
  ```
*/
module.exports = function simple() {
  var article = new Article();
  article.set(['meta', 'title'], 'Simple');
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
  var main = article.get('main');
  main.show('p1');
  main.show('p2');
  main.show('p3');
  main.show('p4');
  article.documentDidLoad();
  article.FORCE_TRANSACTIONS = false;
  return article;
};
