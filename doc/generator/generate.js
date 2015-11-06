var collect = require('./collect');
var each = require('lodash/collection/each');

module.exports = function generate(config) {
  var nodes = collect(config);

  each(nodes, function(node) {
    console.log('Exported node:', JSON.stringify(node, null, 2));
  });
};
