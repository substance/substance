'use strict';

var ListCommand = require('./ListCommand');

var UnorderedListCommand = function(surface) {
  ListCommand.call(this, surface);
};

UnorderedListCommand.Prototype = function() {
  this.ordered = false;
};

ListCommand.extend(UnorderedListCommand);
UnorderedListCommand.static.name = 'unordered-list';

module.exports = UnorderedListCommand;
