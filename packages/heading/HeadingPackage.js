'use strict';

var Heading = require('./Heading');
var HeadingComponent = require('./HeadingComponent');
var HeadingHTMLConverter = require('./HeadingHTMLConverter');

module.exports = {
  name: 'heading',
  configure: function(config) {
    config.addNode(Heading);
    config.addComponent(Heading.type, HeadingComponent);
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
    config.addStyle(__dirname, '_heading.scss');

    config.addLabel('heading1', {
      en: 'Heading 1',
      de: 'Überschrift 1'
    });
    config.addLabel('heading2', {
      en: 'Heading 2',
      de: 'Überschrift 2'
    });
    config.addLabel('heading3', {
      en: 'Heading 3',
      de: 'Überschrift 3'
    });
  }
};
