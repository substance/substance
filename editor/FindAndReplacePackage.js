import { platform } from '../util'
import AnnotationComponent from './AnnotationComponent'
import FindAndReplaceCommand from './FindAndReplaceCommand'
import FindAndReplaceDialog from './FindAndReplaceDialog'

export default {
  name: 'find-and-replace',
  configure: function (config, userConfig) {
    config.addComponent('find-and-replace-dialog', FindAndReplaceDialog)
    config.addComponent('find-marker', AnnotationComponent)

    config.addCommand('open-find', FindAndReplaceCommand, {
      commandGroup: 'find-and-replace',
      action: 'open-find'
    })
    config.addCommand('open-replace', FindAndReplaceCommand, {
      commandGroup: 'find-and-replace',
      action: 'open-replace'
    })
    config.addKeyboardShortcut('CommandOrControl+F', { command: 'open-find' })
    // there are different conventions for opening replace
    if (platform.isMac) {
      config.addKeyboardShortcut('CommandOrControl+Alt+F', { command: 'open-replace' })
    } else {
      config.addKeyboardShortcut('CommandOrControl+H', { command: 'open-replace' })
    }
    config.addLabel('find-and-replace-title', {
      en: 'Find and replace'
    })
    config.addLabel('find', {
      en: 'Find'
    })
    config.addLabel('find-next', {
      en: 'Next match'
    })
    config.addLabel('find-previous', {
      en: 'Previous match'
    })
    config.addLabel('find-case-sensitive', {
      en: 'Match Case'
    })
    config.addLabel('find-whole-word', {
      en: 'Match Whole Word'
    })
    config.addLabel('find-regex', {
      en: 'Use Regular Expression'
    })
    config.addLabel('replace', {
      en: 'Replace'
    })
    config.addLabel('replace-all', {
      en: 'Replace All'
    })
    config.addLabel('next', {
      en: 'Next'
    })
    config.addLabel('previous', {
      en: 'Previous'
    })
    config.addLabel('find-title-manuscript', {
      en: 'Find in Article'
    })
    config.addLabel('find-title-metadata', {
      en: 'Find in Metadata'
    })
    config.addLabel('no-result', {
      en: 'No results'
    })
    config.addLabel('find-replace-title-manuscript', {
      en: 'Find and replace in article'
    })
    config.addLabel('find-replace-title-metadata', {
      en: 'Find and replace in metadata'
    })
    config.addLabel('case-sensitive-title', {
      en: 'Case Sensitive'
    })
    config.addLabel('whole-word-title', {
      en: 'Whole Word'
    })
    config.addLabel('regex-title', {
      en: 'Regex'
    })
  }
}
