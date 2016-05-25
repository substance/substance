/*globals -Document */
'use strict';

var Document = require('../../model/Document');

var ProseArticle = function(schema) {
  Document.call(this, schema);

  this.create({
    type: 'container',
    id: 'body',
    nodes: []
  });
};

Document.extend(ProseArticle);

module.exports = ProseArticle;
