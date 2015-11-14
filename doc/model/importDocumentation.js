var Documentation = require('./Documentation');
var each = require('lodash/collection/each');

function importDocumentation(nodes) {
  var documentation = new Documentation();

  // import data in a block with deactivated indexers and listeners
  // as the data contains cyclic references which
  // cause problems.
  documentation.import(function(tx) {
    var body = tx.get('body');
    each(nodes, function(node) {
      tx.create(node);
      if (node.type === 'namespace') {
        body.show(node.id);
      }
    });
  });

  return documentation;
}

module.exports = importDocumentation;
