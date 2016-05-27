'use strict';

module.exports = function(config) {
  config.addNode(require('./Image'));
  config.addComponent('image', require('./ImageComponent'));
  config.addCommand(require('./ImageCommand'));
  config.addTool(require('./ImageTool'), {
    icon: 'fa-image'
  });
};
