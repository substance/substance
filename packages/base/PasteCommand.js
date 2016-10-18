import Command from '../../ui/Command'

class PasteCommand extends Command {

  getCommandState(params) {
    return {
      disabled: true
    }
  }

  execute(params) {
    // document.execCommand('paste') is officially disabled for security reasons
    // thus there is no way to do it programmatically
    // Allowing this just for 'in-app' pasting is probably also not a good idea,
    // as you would then need to invalidate the cached clipboard, when the system clipboard changes.
    window.alert('Pasting is not supported via context menu. Please use the keyboard shortcut instead.')
    return false
  }
}

export default PasteCommand
