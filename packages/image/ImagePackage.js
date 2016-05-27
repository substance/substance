'use strict';


module.exports = {
  name: 'image',
  configure: function(config) {
    config.addNode(require('./Image'));
    config.addComponent('image', require('./ImageComponent'));
    config.addCommand(require('./ImageCommand'));
    config.addTool(require('./ImageTool'));
  }
};