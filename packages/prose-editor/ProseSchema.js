'use strict';

var DocumentSchema = require('../../model/DocumentSchema');

function ProseSchema() {
  DocumentSchema.call(this, this.constructor.static.name, this.constructor.static.version);

  this._defineSchema();
}

ProseSchema.Prototype = function() {

  this._defineSchema = function() {
    this.addNodes([
      require('../paragraph/Paragraph'),
      require('../heading/Heading'),
      require('../codeblock/Codeblock'),
      require('../blockquote/Blockquote'),
      require('../image/Image'),
      require('../emphasis/Emphasis'),
      require('../strong/Strong'),
      require('../link/Link'),
    ]);
  };

  this.getDefaultTextType = function() {
    return 'paragraph';
  };
};

DocumentSchema.extend(ProseSchema);

ProseSchema.static.name = 'prose-article';
ProseSchema.static.version = '1.0.0';

module.exports = ProseSchema;
