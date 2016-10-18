import Command from '../../ui/Command'
import inBrowser from '../../util/inBrowser'

class CopyCommand extends Command {

  getCommandState(params) {
    let disabled = !params.selection || params.selection.isNull()
    return {
      disabled: disabled
    }
  }

  execute() {
    if (inBrowser) {
      window.document.execCommand('copy')
      return true
    }
    return false
  }
}

export default CopyCommand
