var map = require('lodash/map');

module.exports = function(collection, prop) {
  return map(collection, function(item) { return item[prop]; });
};
