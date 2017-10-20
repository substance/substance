class ExecuteCommandHandler {
  constructor(editorSession, commandName) {
    this.editorSession = editorSession
    this.commandName = commandName
  }
  execute(params) {
    let commandState = params.editorSession.getCommandStates()[this.commandName]
    // Don't know what to do, may be handled at a higher level
    if (!commandState) return false
    if (!commandState.disabled) {
      this.editorSession.executeCommand(this.commandName, params)
    }
    return true
  }
}
export default ExecuteCommandHandler
