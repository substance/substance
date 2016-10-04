/**
  Commands are used to perform UI triggered actions on the document. For instance the
  {@link ui/AnnotationCommand} takes care of creating, expanding, truncating and
  deleting annotations such as strong and emphasis. It does so by determining a
  commandState by inspecting the current selection, which is used to parametrize
  the corresponding tool component. E.g. the strong tool gets active and clickable
  in create mode when a word in the text is selected. Triggered by a click on the tool,
  or a keyboard shortcut, the command gets executed by running the code specified in the
  execute method.

  @class Command
  @abstract

  @example

  ```
  class MyCommand extends Command {
    getCommandState(props, context) {
      // determine commandState based on props and context
    }

    execute(props, context) {
      // perform operations on the document
    }
  }
  ```
*/

/** INCLUDE_IN_API_DOCS */
class Command {

  /**
    Construcutor is only used internally.

    @constructor
    @param {Object} config    Config provided during command registration
  */
  constructor(config) {
    this.config = config || {}
    this.name = this.config.name
    if (!this.name) {
      throw new Error("'name' is required");
    }
  }

  get _isCommand() {
    return true
  }

  /**
    Get the command name specified at command registration. See
    {@link util/Configurator#addCommand}
  */
  getName() {
    return this.name
  }

  /**
    Determines command state, based on passed params and context. The command
    state is usually used as props for tool components.

    For an example implementation see {@link ui/EditAnnotation#getCommandState}

    @param {Object} params      Provides documentSession, selectionState, surface, selection
    @param {Object} context     Provides app-specific context.
  */
  getCommandState(params, context) { // eslint-disable-line
    throw new Error('Command.getCommandState() is abstract.')
  }

  /**
    Execute command and perform operations on the document

    @param {Object} params      Provides commandState, documentSession, selectionState, surface, selection
    @param {Object} context     Provides app-specific context.

    @return {Object} info object with execution details
  */
  execute(params, context) { // eslint-disable-line
    throw new Error('Command.execute() is abstract.')
  }

  _getDocumentSession(params, context) {
    let docSession = params.documentSession || context.documentSession
    if (!docSession) {
      throw new Error("'documentSession' is required.")
    }
    return docSession
  }

  _getSelection(params) {
    let sel = params.selection || params.selectionState.getSelection()
    if (!sel) {
      throw new Error("'selection' is required.")
    }
    return sel
  }

}

export default Command
