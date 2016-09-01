'use strict';

import Document from '../../model/Document'

function ProseArticle(schema) {
  Document.call(this, schema);
  this._initialize();
}

ProseArticle.Prototype = function() {

  this._initialize = function() {
    this.create({
      type: 'container',
      id: 'body',
      nodes: []
    });
  };

};

Document.extend(ProseArticle);

export default ProseArticle;
