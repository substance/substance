import EditAnnotationCommand from '../../ui/EditAnnotationCommand'
import Link from './Link'
import LinkComponent from './LinkComponent'
import LinkCommand from './LinkCommand'
import LinkHTMLConverter from './LinkHTMLConverter'
import EditLinkTool from './EditLinkTool'

export default {
  name: 'link',
  configure: function (config) {
    config.addNode(Link)
    config.addComponent('link', LinkComponent)
    config.addConverter('html', LinkHTMLConverter)
    config.addConverter('xml', LinkHTMLConverter)
    config.addCommand('link', LinkCommand, {
      nodeType: 'link',
      commandGroup: 'annotations'
    })
    config.addCommand('edit-link', EditAnnotationCommand, {
      nodeType: 'link',
      commandGroup: 'prompt'
    })
    config.addTool('edit-link', EditLinkTool)
    config.addIcon('link', { 'fontawesome': 'fa-link' })
    config.addIcon('open-link', { 'fontawesome': 'fa-external-link-alt' })
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
    config.addKeyboardShortcut('CommandOrControl+K', { command: 'link' })
  },
  Link,
  LinkComponent,
  LinkCommand,
  LinkHTMLConverter,
  EditLinkTool
}
