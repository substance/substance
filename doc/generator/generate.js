var collectNodes = require('./collectNodes');

module.exports = function generate(config) {
  var nodes = collectNodes(config);
  return nodes;
};
