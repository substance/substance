'use strict';

var uuid = require('../../util/uuid');

module.exports = function insertParagraph(tx) {
  var body = tx.get('body');
  var id = uuid();
  tx.create({
    id: id,
    type: 'paragraph',
    content: '0123456789'
  });
  body.show(id);
};
