import Command from '../../ui/Command'

class Redo extends Command {

  getCommandState(params) {
    let docSession = params.documentSession
    return {
      disabled: !docSession.canRedo(),
      active: false
    }
  }

  execute(params) {
    let docSession = params.documentSession
    if (docSession.canRedo()) {
      docSession.redo()
      return true
    } else {
      return false
    }
  }

}

export default Redo
