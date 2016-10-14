import Command from '../../ui/Command'

class CopyCommand extends Command {

  getCommandState(params) {
    let docSession = params.documentSession
    let surface = params.surface
    return {
      disabled: false
    }
  }

  execute(params) {
    let docSession = params.documentSession
    let surface = params.surface

    // Only works internally
    console.log('TODO: this does not land in browser clipboard atm. Resides in Clipboard.clipboarData')
    surface.clipboard.copy()
    return true
  }
}

export default CopyCommand
