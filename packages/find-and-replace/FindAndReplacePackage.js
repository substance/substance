import FindAndReplaceCommand from './FindAndReplaceCommand'
import ToggleFindAndReplaceCommand from './ToggleFindAndReplaceCommand'
import FindNextCommand from './FindNextCommand'
import FindPreviousCommand from './FindPreviousCommand'
import FindAndReplaceTool from './FindAndReplaceTool'
import FindAndReplaceManager from './FindAndReplaceManager'

export default {
  name: 'find-and-replace',
  configure: function(config) {
    config.addCommand('find-and-replace', FindAndReplaceCommand, {
      commandGroup: 'workflows'
    })
    config.addCommand('toggle-find-and-replace', ToggleFindAndReplaceCommand, {
      commandGroup: 'find-and-replace'
    })
    config.addCommand('find-next', FindNextCommand, {
      commandGroup: 'find-and-replace'
    })
    config.addCommand('find-next', FindPreviousCommand, {
      commandGroup: 'find-and-replace'
    })
    config.addTool('find-and-replace', FindAndReplaceTool)

    // Experimental API: This adds a custom manager
    config.addManager('find-and-replace', FindAndReplaceManager)
    config.addKeyboardShortcut('cmd+alt+f', { command: 'toggle-find-and-replace' })
  }
}
