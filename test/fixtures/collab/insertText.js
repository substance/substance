var DocumentSession = require('../../../model/DocumentSession');
var insertTextTr = require('../../../model/transform/insertText');

/*
  Simple fixture utility to create example changes for insert text operations
*/
function insertText(doc, pos, text) {
  var session = new DocumentSession(doc);
  var change = session.transaction(function(tx) {

    var sel = doc.createSelection({
      type: 'property',
      path: [ 'p1', 'content'],
      startOffset: pos,
      endOffset: pos
    });

    insertTextTr(tx, {
      selection: sel,
      text: text || '$$$'
    });
  });
  return change.toJSON();
}

module.exports = insertText;