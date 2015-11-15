var Documentation = require('./Documentation');
var each = require('lodash/collection/each');
var find = require('lodash/collection/find');

function importDocumentation(nodes) {
  var documentation = new Documentation();

  // import data in a block with deactivated indexers and listeners
  // as the data contains cyclic references which
  // cause problems.
  documentation.import(function(tx) {
    var body = tx.get('body');
    each(nodes, function(node) {
      // EXPERIMENTAL: we want to render components specially
      // or at least render a dedicated constructor for usage with $$
      // IMO it would not be a good idea to convert the node to a type: 'component'
      // here, as we would loose its 'class' support
      // Probably we should take care of it during rendering.
      // For the records: this way we could detect if a class is a component
      if (node.type === 'class' && node.tags.length > 0) {
        var isComponent = !!find(node.tags, 'type', 'component');
        if (isComponent) {
          console.log('Class %s is a component!', node.id);
        }
      }
      tx.create(node);
      if (node.type === 'namespace') {
        body.show(node.id);
      }
    });
  });

  return documentation;
}

module.exports = importDocumentation;
