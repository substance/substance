'use strict';

import Codeblock from './Codeblock'
import CodeblockComponent from './CodeblockComponent'
import CodeblockHTMLConverter from './CodeblockHTMLConverter'
import CodeblockXMLConverter from './CodeblockXMLConverter'

export default {
  name: 'codeblock',
  configure: function(config) {
    config.addNode(Codeblock);
    config.addComponent('codeblock', CodeblockComponent);
    config.addConverter('html', CodeblockHTMLConverter);
    config.addConverter('xml', CodeblockXMLConverter);
    config.addTextType({
      name: 'codeblock',
      data: {type: 'codeblock'}
    });
    config.addLabel('codeblock', {
      en: 'Codeblock',
      de: 'Codeblock'
    });
  },
  Codeblock: Codeblock,
  CodeblockComponent: CodeblockComponent,
  CodeblockHTMLConverter: CodeblockHTMLConverter
};
