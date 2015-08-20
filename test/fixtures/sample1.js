'use strict';

var Article = require('../test_article');

module.exports = function sample1() {
  var article = new Article();
  article.set(['meta', 'title'], 'Sample1');
  article.create({
    type: 'heading',
    id: 'h1',
    content: 'Section 1',
    level: 1
  });
  article.create({
    type: 'paragraph',
    id: 'p1',
    content: 'Paragraph 1'
  });
  article.create({
    type: 'heading',
    id: 'h2',
    content: 'Section 2',
    level: 1
  });
  article.create({
    type: 'paragraph',
    id: 'p2',
    content: 'Paragraph with annotation'
  });
  article.create({
    type: 'emphasis',
    id: 'em1',
    path: ['p2', 'content'],
    startOffset: 15,
    endOffset: 25
  })
  article.create({
    type: 'heading',
    id: 'h3',
    content: 'Section 2.2',
    level: 2
  });
  article.create({
    type: 'paragraph',
    id: 'p3',
    content: 'Paragraph 3'
  });
  article.create({
    type: "test-node",
    id: "test",
    boolVal: true,
    stringVal: "Test",
    arrayVal: [1, 2, 3, 4],
    objectVal: { "a": 1, "b": 2 }
  });
  var main = article.get('main');
  main.show('h1');
  main.show('p1');
  main.show('h2');
  main.show('p2');
  main.show('h3');
  main.show('p3');
  article.documentDidLoad();
  article.FORCE_TRANSACTIONS = false;
  return article;
};
