'use strict';

var Document = require('../../model/Document');
var DocumentSchema = require('../../model/DocumentSchema');

var schema = new DocumentSchema('prose-article', '1.0.0');
schema.getDefaultTextType = function() {
  return 'paragraph';
};

schema.addNodes([
  require('../paragraph/Paragraph'),
  require('../heading/Heading'),
  require('../codeblock/Codeblock'),
  require('../blockquote/Blockquote'),
  require('../image/Image'),
  require('../emphasis/Emphasis'),
  require('../strong/Strong'),
  require('../link/Link'),
]);

var Article = function() {
  Document.call(this, schema);

  this.create({
    type: 'container',
    id: 'body',
    nodes: []
  });
};

Document.extend(Article);
Article.schema = schema;

module.exports = Article;
