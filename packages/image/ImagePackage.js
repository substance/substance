'use strict';

module.exports = function(config) {
  config.addNode(require('./Image'));
  config.addCommand(require('./ImageCommand'));
  config.addTool(require('./ImageTool'), {
    icon: 'fa-image'
  });
};
