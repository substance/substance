import Command from '../../ui/Command'

class PasteCommand extends Command {

  getCommandState(params) {
    let surface = params.surface
    return {
      disabled: !Boolean(surface)
    }
  }

  execute(params) {
    let surface = params.surface

    if (surface) {
      console.log('HACK: Only works when Clipboard.clipboardData is set.')
      console.log('TODO: Add access to native clipboard')
      surface.clipboard.paste()
      return true
    }
    return false
  }
}

export default PasteCommand
