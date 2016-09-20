import Command from '../../ui/Command'

class Redo extends Command {
  constructor(...args) {
    super(...args);
  }

  getCommandState(props, context) {
    let docSession = context.documentSession
    return {
      disabled: !docSession.canRedo(),
      active: false
    }
  }

  execute(props, context) {
    let docSession = context.documentSession
    if (docSession.canRedo()) {
      docSession.redo()
      return true
    } else {
      return false
    }
  }

}

export default Redo
