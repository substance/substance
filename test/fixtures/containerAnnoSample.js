'use strict';

module.exports = function(article) {
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
    container: 'body',
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
  var body = article.get('body');
  body.show('p1');
  body.show('p2');
  body.show('p3');
  body.show('p4');
  article.FORCE_TRANSACTIONS = false;
  return article;
};
