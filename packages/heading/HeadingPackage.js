import { platform } from '../../util'
import Heading from './Heading'
import HeadingComponent from './HeadingComponent'
import HeadingHTMLConverter from './HeadingHTMLConverter'
import { SwitchTextTypeCommand, Tool } from '../../ui'

export default {
  name: 'heading',
  configure: function(config) {
    config.addNode(Heading)
    config.addComponent(Heading.type, HeadingComponent)
    config.addConverter('html', HeadingHTMLConverter)
    config.addConverter('xml', HeadingHTMLConverter)

    config.addCommand('heading1', SwitchTextTypeCommand, {
      spec: { type: 'heading', level: 1 },
      commandGroup: 'text-types'
    })
    config.addCommand('heading2', SwitchTextTypeCommand, {
      spec: { type: 'heading', level: 2 },
      commandGroup: 'text-types'
    })
    config.addCommand('heading3', SwitchTextTypeCommand, {
      spec: { type: 'heading', level: 3 },
      commandGroup: 'text-types'
    })
    if (platform.isMac) {
      config.addKeyboardShortcut('cmd+alt+1', { command: 'heading1' })
      config.addKeyboardShortcut('cmd+alt+2', { command: 'heading2' })
      config.addKeyboardShortcut('cmd+alt+3', { command: 'heading3' })
    } else {
      config.addKeyboardShortcut('ctrl+alt+1', { command: 'heading1' })
      config.addKeyboardShortcut('ctrl+alt+2', { command: 'heading2' })
      config.addKeyboardShortcut('ctrl+alt+3', { command: 'heading3' })
    }

    config.addLabel('heading1', {
      en: 'Heading 1',
      de: 'Überschrift 1'
    })
    config.addLabel('heading2', {
      en: 'Heading 2',
      de: 'Überschrift 2'
    })
    config.addLabel('heading3', {
      en: 'Heading 3',
      de: 'Überschrift 3'
    })
    config.addIcon('heading1', { 'fontawesome': 'fa-header' })
    config.addIcon('heading2', { 'fontawesome': 'fa-header' })
    config.addIcon('heading3', { 'fontawesome': 'fa-header' })
  },
  Heading,
  HeadingComponent,
  HeadingHTMLConverter
}
