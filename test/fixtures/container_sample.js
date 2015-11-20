'use strict';

var Article = require('../model/TestArticle');

/**
 * This fixture contains different kind of nodes:
 * - simple nodes, with only one editable property such as paragraphs
 * - structured nodes, with a set of editable properties
 * - nested nodes, with one levels (such as list) or more levels (such as tables)
 */
module.exports = function() {
  var article = new Article();
  article.set(['meta', 'title'], 'Sample1');
  var main = article.get('main');
  article.create({ type: 'paragraph', id: 'p1', content: '0123456789' });
  main.show('p1');
  article.create({ type: 'paragraph', id: 'p2', content: '0123456789' });
  main.show('p2');
  article.create({ type: 'structured-node', id: 'sn1', title: '0123456789', body: '0123456789', caption: '0123456789' });
  main.show('sn1');
  article.create({ type: 'paragraph', id: 'p3', content: '0123456789' });
  main.show('p3');
  article.create({ type: 'list-item', id: 'li1', parent: 'list1', content: '0123456789' });
  article.create({ type: 'list-item', id: 'li2', parent: 'list1', content: '0123456789' });
  article.create({ type: 'list-item', id: 'li3', parent: 'list1', content: '0123456789' });
  article.create({ type: 'list-item', id: 'li4', parent: 'list1', content: '0123456789' });
  article.create({ type: 'list', id: 'list1', ordered: false, items: ['li1', 'li2', 'li3', 'li4'] });
  main.show('list1');
  article.create({ type: 'paragraph', id: 'p4', content: '0123456789' });
  main.show('p4');
  article.create({ type: 'table-cell', id: 'td1', parent: 'tr1', content: '0123456789' });
  article.create({ type: 'table-cell', id: 'td2', parent: 'tr1', content: '0123456789' });
  article.create({ type: 'table-cell', id: 'td3', parent: 'tr1', content: '0123456789' });
  article.create({ type: 'table-row', id: 'tr1', parent: 'tsec1', cells: ['td1', 'td2', 'td3'] });
  article.create({ type: 'table-cell', id: 'td4', parent: 'tr2', content: '0123456789' });
  article.create({ type: 'table-cell', id: 'td5', parent: 'tr2', content: '0123456789' });
  article.create({ type: 'table-cell', id: 'td6', parent: 'tr2', content: '0123456789' });
  article.create({ type: 'table-row', id: 'tr2', parent: 'tsec1', cells: ['td4', 'td5', 'td6'] });
  article.create({ type: 'table-section', id: 'tsec1', parent: 'table1', rows: ['tr1', 'tr2'] });
  article.create({ type: 'table', id: 'table1', sections: ['tsec1'] });
  main.show('table1');
  article.create({ type: 'paragraph', id: 'p5', content: '0123456789' });
  main.show('p5');
  article.documentDidLoad();
  article.FORCE_TRANSACTIONS = false;
  return article;
};
