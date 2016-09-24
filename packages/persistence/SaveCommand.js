import Command from '../../ui/Command'

class SaveCommand extends Command {
  constructor() {
    super({ name: 'save' })
  }

  getCommandState(props, context) {
    let dirty = context.documentSession.isDirty()
    return {
      disabled: !dirty,
      active: false
    }
  }

  execute(props, context) {
    let documentSession = context.documentSession
    documentSession.save()
    return {
      status: 'saving-process-started'
    }
  }
}

export default SaveCommand
