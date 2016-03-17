'use strict';

var DocumentSchema = require('../../model/DocumentSchema');

var VERSION = '1.0.0';

function ProseArticleSchema() {
  ProseArticleSchema.super.call(this, 'prose-article', VERSION);

  this.addNodes(ProseArticleSchema.nodes);
}

ProseArticleSchema.Prototype = function() {

  this.getDefaultTextType = function() {
    return 'paragraph';
  };

};

DocumentSchema.extend(ProseArticleSchema);

ProseArticleSchema.nodes = [
  require('../paragraph/Paragraph'),
  require('../heading/Heading'),
  require('../codeblock/Codeblock'),
  require('../blockquote/Blockquote'),
  require('../image/Image'),
  require('../emphasis/Emphasis'),
  require('../strong/Strong'),
  require('../link/Link'),
];

module.exports = ProseArticleSchema;
