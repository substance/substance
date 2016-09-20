'use strict';

import Strong from './Strong'
import StrongHTMLConverter from './StrongHTMLConverter'
import StrongXMLConverter from './StrongXMLConverter'
import AnnotationCommand from '../../ui/AnnotationCommand'
import AnnotationComponent from '../../ui/AnnotationComponent'
import AnnotationTool from '../../ui/AnnotationTool'

export default {
  name: 'strong',
  configure: function(config, options) {
    options = options || {};
    config.addNode(Strong);
    config.addConverter('html', StrongHTMLConverter);
    config.addConverter('xml', StrongXMLConverter);
    config.addComponent('strong', AnnotationComponent);
    config.addCommand('strong', AnnotationCommand, { nodeType: 'strong' });
    config.addTool('strong', AnnotationTool, {
      target: options.toolTarget || 'annotations'
    });
    config.addIcon('strong', { 'fontawesome': 'fa-bold' });
    config.addLabel('strong', {
      en: 'Strong emphasis',
      de: 'Starke Betonung'
    });
  },
  Strong: Strong,
  StrongHTMLConverter: StrongHTMLConverter
};
