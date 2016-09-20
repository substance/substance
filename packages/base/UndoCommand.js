import Command from '../../ui/Command'

class Undo extends Command {

  getCommandState(props, context) {
    let docSession = context.documentSession
    return {
      disabled: !docSession.canUndo(),
      active: false
    }
  }

  execute(props, context) {
    var docSession = context.documentSession
    if (docSession.canUndo()) {
      docSession.undo()
      return true
    }
    return false
  }

}

export default Undo
