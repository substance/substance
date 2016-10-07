import Command from '../../ui/Command'

class Undo extends Command {

  getCommandState(params) {
    let docSession = params.documentSession
    return {
      disabled: !docSession.canUndo(),
      active: false
    }
  }

  execute(params) {
    let docSession = params.documentSession
    if (docSession.canUndo()) {
      docSession.undo()
      return true
    }
    return false
  }

}

export default Undo
