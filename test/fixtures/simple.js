'use strict';

var Article = require('../test_article');

module.exports = function simple() {
  var article = new Article();
  article.set(['meta', 'title'], 'Simple');
  article.create({
    type: 'paragraph',
    id: 'p1',
    content: '0123456789'
  });
  var main = article.get('main');
  main.show('p1');
  article.documentDidLoad();
  article.FORCE_TRANSACTIONS = false;
  return article;
};
