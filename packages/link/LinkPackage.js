'use strict';

import Link from './Link'
import LinkComponent from './LinkComponent'
import LinkCommand from './LinkCommand'
import EditLinkCommand from './EditLinkCommand'
import LinkHTMLConverter from './LinkHTMLConverter'
import LinkXMLConverter from './LinkXMLConverter'
import AnnotationTool from '../../ui/AnnotationTool'
import EditLinkTool from './EditLinkTool'


export default {
  name: 'link',
  configure: function(config, options) {
    config.addNode(Link);
    config.addComponent('link', LinkComponent);
    config.addConverter('html', LinkHTMLConverter);
    config.addConverter('xml', LinkXMLConverter);
    config.addCommand('link', LinkCommand, {nodeType: 'link'});
    config.addCommand('edit-link', EditLinkCommand, {nodeType: 'link'});
    config.addTool('link', AnnotationTool, {target: options.toolTarget || 'annotations'});
    config.addTool('edit-link', EditLinkTool, { target: 'overlay' });
    config.addIcon('link', { 'fontawesome': 'fa-link'});
    config.addIcon('open-link', { 'fontawesome': 'fa-external-link' });
    config.addLabel('link', {
      en: 'Link',
      de: 'Link'
    });
  },
  Link: Link,
  LinkComponent: LinkComponent,
  LinkCommand: LinkCommand,
  EditLinkTool: EditLinkTool,
};
