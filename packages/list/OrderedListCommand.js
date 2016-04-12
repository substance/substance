'use strict';

var ListCommand = require('./ListCommand');

var OrderedListCommand = function(surface) {
  ListCommand.call(this, surface);
};

OrderedListCommand.Prototype = function() {
  this.ordered = true;
};

ListCommand.extend(OrderedListCommand);
OrderedListCommand.static.name = 'ordered-list';

module.exports = OrderedListCommand;
