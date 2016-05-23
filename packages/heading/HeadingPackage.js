'use strict';

var Heading = require('./Heading');
var HeadingComponent = require('./HeadingComponent');
var HeadingHTMLConverter = require('./HeadingHTMLConverter');

module.exports = function(config) {
  config.addNode(Heading);
  config.addComponent('heading', HeadingComponent);
  config.addConverter(HeadingHTMLConverter);

  config.addTextType({
    name: 'heading',
    data: {type: 'heading', level: 1}
  });

  config.addTextType({
    name: 'heading',
    data: {type: 'heading', level: 2}
  });

  config.addTextType({
    name: 'heading',
    data: {type: 'heading', level: 3}
  });
  
};
