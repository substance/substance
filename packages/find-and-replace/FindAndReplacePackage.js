import FindAndReplaceCommand from './FindAndReplaceCommand'
import ToggleFindAndReplaceCommand from './ToggleFindAndReplaceCommand'
import CloseFindAndReplaceCommand from './CloseFindAndReplaceCommand'
import FindNextCommand from './FindNextCommand'
import FindPreviousCommand from './FindPreviousCommand'
import ReplaceNextCommand from './ReplaceNextCommand'
import ReplaceAllCommand from './ReplaceAllCommand'
import FindAndReplaceTool from './FindAndReplaceTool'
import FindAndReplaceManager from './FindAndReplaceManager'

export default {
  name: 'find-and-replace',
  configure: function(config, userConfig) {
    config.addCommand('find-and-replace', FindAndReplaceCommand, {
      commandGroup: 'workflows'
    })
    config.addCommand('toggle-find-and-replace', ToggleFindAndReplaceCommand, {
      commandGroup: 'find-and-replace'
    })
    config.addCommand('close-find-and-replace', CloseFindAndReplaceCommand, {
      commandGroup: 'find-and-replace'
    })
    config.addCommand('find-next', FindNextCommand, {
      commandGroup: 'find-and-replace'
    })
    config.addCommand('find-previous', FindPreviousCommand, {
      commandGroup: 'find-and-replace'
    })
    config.addCommand('replace-next', ReplaceNextCommand, {
      commandGroup: 'find-and-replace'
    })
    config.addCommand('replace-all', ReplaceAllCommand, {
      commandGroup: 'find-and-replace'
    })
    config.addTool('find-and-replace', FindAndReplaceTool)
    config.addKeyboardShortcut('cmd+f', { command: 'toggle-find-and-replace' })
    config.addKeyboardShortcut('cmd+alt+f', { command: 'toggle-find-and-replace' })
    config.addKeyboardShortcut('cmd+g', { command: 'find-next' })
    config.addKeyboardShortcut('cmd+shift+g', { command: 'find-previous' })
    config.addKeyboardShortcut('cmd+alt+e', { command: 'replace-next' })
    // TODO: we want to bind this to the ESC button instead
    config.addKeyboardShortcut('esc', { command: 'close-find-and-replace' })
    config.addManager('find-and-replace', FindAndReplaceManager)
    config.addLabel('find-and-replace-title', {
      en: 'Find and replace',
      de: 'Suchen und Ersetzen'
    })
    config.setFindAndReplaceConfig(userConfig)
  },
  FindAndReplaceCommand,
  ToggleFindAndReplaceCommand,
  FindNextCommand,
  FindPreviousCommand,
  ReplaceNextCommand,
  ReplaceAllCommand,
  FindAndReplaceTool,
  FindAndReplaceManager
}
