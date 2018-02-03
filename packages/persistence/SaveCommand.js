import Command from '../../ui/Command'

class SaveCommand extends Command {
  constructor() {
    super({ name: 'save' })
  }

  getCommandState(params) {
    let dirty = params.editorSession.hasUnsavedChanges()
    return {
      disabled: !dirty,
      active: false
    }
  }

  execute(params) {
    let editorSession = params.editorSession
    editorSession.save()
    return {
      status: 'saving-process-started'
    }
  }
}

export default SaveCommand
