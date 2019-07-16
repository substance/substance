import Command from './Command'

const ENABLED = Object.freeze({ disabled: false })

export default class FindAndReplaceCommand extends Command {
  getCommandState (params, context) {
    let fnr = context.findAndReplaceManager
    if (!fnr) return { disabled: true }

    switch (this.config.action) {
      case 'open-find':
      case 'open-replace': {
        return ENABLED
      }
    }
  }

  execute (params, context) {
    let fnr = context.findAndReplaceManager
    switch (this.config.action) {
      case 'open-find': {
        fnr.openDialog()
        break
      }
      case 'open-replace': {
        fnr.openDialog('replace')
        break
      }
    }
  }
}
