import Link from './Link'
import LinkComponent from './LinkComponent'
import LinkCommand from './LinkCommand'
import LinkHTMLConverter from './LinkHTMLConverter'
import LinkXMLConverter from './LinkXMLConverter'
import AnnotationTool from '../../ui/AnnotationTool'
import EditLinkTool from './EditLinkTool'
import EditAnnotationCommand from '../../ui/EditAnnotationCommand'
import platform from '../../util/platform'

export default {
  name: 'link',
  configure: function(config, options) {
    config.addNode(Link)
    config.addComponent('link', LinkComponent)
    config.addConverter('html', LinkHTMLConverter)
    config.addConverter('xml', LinkXMLConverter)
    config.addCommand('link', LinkCommand, {nodeType: 'link'})
    config.addCommand('edit-link', EditAnnotationCommand, {nodeType: 'link'})
    config.addTool('link', AnnotationTool, {toolGroup: options.toolGroup || 'annotations'})
    config.addTool('edit-link', EditLinkTool, { toolGroup: options.editLinkToolGroup || 'overlay' })
    config.addIcon('link', { 'fontawesome': 'fa-link'})
    config.addIcon('open-link', { 'fontawesome': 'fa-external-link' })
    config.addLabel('link', {
      en: 'Link',
      de: 'Link'
    })
    config.addLabel('open-link', {
      en: 'Open Link',
      de: 'Link öffnen'
    })
    config.addLabel('delete-link', {
      en: 'Remove Link',
      de: 'Link löschen'
    })
    if (platform.isMac) {
      config.addKeyboardShortcut('cmd+k', { command: 'link' })
    } else {
      config.addKeyboardShortcut('ctrl+k', { command: 'link' })
    }
  },
  Link: Link,
  LinkComponent: LinkComponent,
  LinkCommand: LinkCommand,
  EditLinkTool: EditLinkTool,
}
