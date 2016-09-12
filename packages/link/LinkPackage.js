'use strict';

import Link from './Link'
import LinkComponent from './LinkComponent'
import LinkCommand from './LinkCommand'
import LinkHTMLConverter from './LinkHTMLConverter'
import LinkXMLConverter from './LinkXMLConverter'
import AnnotationTool from '../../ui/AnnotationTool'
import EditLinkTool from './EditLinkTool'


export default {
  name: 'link',
  configure: function(config) {
    config.addNode(Link);
    config.addComponent('link', LinkComponent);
    config.addConverter('html', LinkHTMLConverter);
    config.addConverter('xml', LinkXMLConverter);
    config.addCommand('link', LinkCommand, {nodeType: 'link'});
    config.addTool('link', AnnotationTool);
    config.addTool('edit-link', EditLinkTool, { overlay: true });
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
