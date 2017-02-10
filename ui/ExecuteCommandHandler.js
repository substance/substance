class ExecuteCommandHandler {
  constructor(editorSession, commandName) {
    this.editorSession = editorSession
    this.commandName = commandName
  }
  execute(params) {
    let commandState = params.editorSession.getCommandStates()[this.commandName]
    if (!commandState || commandState.disabled) return false
    this.editorSession.executeCommand(this.commandName, params)
    return true
  }
}
export default ExecuteCommandHandler