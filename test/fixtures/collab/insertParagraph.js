var DocumentSession = require('../../../model/DocumentSession');
var uuid = require('../../../util/uuid');

/*
  Simple fixture utility to create example changes on existing documents
*/
function insertParagraph(doc) {
  var session = new DocumentSession(doc);
  var change = session.transaction(function(tx) {
    var body = tx.get('body');
    var id = uuid();
    tx.create({
      id: id,
      type: 'paragraph',
      content: '0123456789'
    });
    body.show(id);
  });
  return change.toJSON();
}

module.exports = insertParagraph;