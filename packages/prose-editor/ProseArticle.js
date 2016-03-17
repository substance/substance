'use strict';

var Document = require('../../model/Document');
var ProseArticleSchema = require('./ProseArticleSchema');

var Article = function() {
  Document.call(this, this.constructor.static.schema);

  this.create({
    type: 'container',
    id: 'body',
    nodes: []
  });
};

Document.extend(Article);

Article.static.schema = new ProseArticleSchema();

module.exports = Article;
