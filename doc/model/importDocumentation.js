var Documentation = require('./Documentation');
var each = require('lodash/collection/each');

function importDocumentation(nodes) {
  var documentation = new Documentation();
  var body = documentation.get('body');

  each(nodes, function(node, index) {
    documentation.create(node);
    if (node.type === 'namespace') {
      body.show(node.id);
    }
  });
  
  return documentation;  
}

module.exports = importDocumentation;
