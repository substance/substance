'use strict';

import Emphasis from './Emphasis'
import EmphasisHTMLConverter from './EmphasisHTMLConverter'
import EmphasisXMLConverter from './EmphasisXMLConverter'
import AnnotationCommand from '../../ui/AnnotationCommand'
import AnnotationComponent from '../../ui/AnnotationComponent'
import AnnotationTool from '../../ui/AnnotationTool'


export default {
  name: 'emphasis',
  configure: function(config, options) {
    config.addNode(Emphasis);
    config.addConverter('html', EmphasisHTMLConverter);
    config.addConverter('xml', EmphasisXMLConverter);
    config.addComponent('emphasis', AnnotationComponent);
    config.addCommand('emphasis', AnnotationCommand, { nodeType: Emphasis.type });
    config.addTool('emphasis', AnnotationTool, {
      target: options.toolTarget || 'annotations'
    });
    config.addIcon('emphasis', { 'fontawesome': 'fa-italic' });
    config.addLabel('emphasis', {
      en: 'Emphasis',
      de: 'Betonung'
    });
  },
  Emphasis: Emphasis,
  EmphasisHTMLConverter: EmphasisHTMLConverter
};
