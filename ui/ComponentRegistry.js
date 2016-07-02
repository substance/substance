'use strict';

var Registry = require('../util/Registry');

function ComponentRegistry(entries) {
  Registry.call(this, entries, function(ComponentClass) {
    if (!ComponentClass.prototype._isComponent) {
      throw new Error('Component registry: wrong type. Expected a ComponentClass. Was: ' + String(ComponentClass));
    }
  });
}

Registry.extend(ComponentRegistry);

module.exports = ComponentRegistry;
