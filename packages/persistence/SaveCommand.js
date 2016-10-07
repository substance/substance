import Command from '../../ui/Command'

class SaveCommand extends Command {
  constructor() {
    super({ name: 'save' })
  }

  getCommandState(params) {
    let dirty = params.documentSession.isDirty()
    return {
      disabled: !dirty,
      active: false
    }
  }

  execute(params) {
    let documentSession = params.documentSession
    documentSession.save()
    return {
      status: 'saving-process-started'
    }
  }
}

export default SaveCommand
