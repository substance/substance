'use strict';

var Heading = require('./Heading');
var HeadingComponent = require('./HeadingComponent');
var HeadingHTMLConverter = require('./HeadingHTMLConverter');

module.exports = {
  name: 'heading',
  configure: function(config) {
    config.addNode(Heading);
    config.addComponent(Heading.static.name, HeadingComponent);
    config.addConverter('html', HeadingHTMLConverter);
    config.addTextType({
      name: 'heading1',
      data: {type: 'heading', level: 1}
    });
    config.addTextType({
      name: 'heading2',
      data: {type: 'heading', level: 2}
    });
    config.addTextType({
      name: 'heading3',
      data: {type: 'heading', level: 3}
    });
  }
};
