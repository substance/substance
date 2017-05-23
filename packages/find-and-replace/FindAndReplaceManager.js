
class FindAndReplaceManager {

  constructor(context) {
    if (!context.editorSession) {
      throw new Error('EditorSession required.')
    }

    this.editorSession = context.editorSession
    this.doc = this.editorSession.getDocument()
    this.context = Object.assign({}, context, {
      // for convenienve we provide access to the doc directly
      doc: this.doc
    })

    this._state = {
      disabled: false,
      findString: '',
      replaceString: '',
      // Consists a sequence of property selections
      matches: [],
      selectedMatch: undefined
    }
  }

  /*
    Derive command state for FindAndReplaceTool
  */
  getCommandState() {
    let state = this._state
    let commandState = {
      disabled: state.disabled,
      findString: state.findString,
      replaceString: state.replaceString,
      // Used to display '4 of 10' etc.
      totalMatches: state.matches.length,
      selectedMatch: state.selectedMatch + 1
    }
    return commandState
  }

  enable() {
    this._state.disabled = false
  }

  disable() {
    this._state.disabled = true
  }

  toggleEnabled() {
    this._state.disabled = !this._state.disabled
    this._propagateUpdate()
  }

  /*
    Start find and replace workflow
  */
  startFind(findString, replaceString) {
    this._state.findString = findString
    this._state.replaceString = replaceString
    // TODO: Replace with real implementation
    this._state.matches = [{}, {}]
    this._state.selectedMatch = 0
    this._propagateUpdate()
  }

  /*
    Find next match
  */
  findNext() {
    let index = this._state.selectedMatch
    let totalMatches = this._state.matches.length
    this._state.selectedMatch = (index + 1) % totalMatches
    this._propagateUpdate()
  }

  /*
    Find previous match
  */
  findPrevious() {
    let index = this._state.selectedMatch
    let totalMatches = this._state.matches.length
    this._state.selectedMatch = (index - 1) % totalMatches
    this._propagateUpdate()
  }

  /*
    Replace next occurence
  */
  replaceNext() {
    throw new Error('Not implemented')
  }

  /*
    Replace all occurences
  */
  replaceAll() {
    throw new Error('Not implemented')
  }

  _propagateUpdate() {
    // HACK: we make commandStates dirty in order to trigger re-evaluation
    this.editorSession._setDirty('commandStates')
    this.editorSession.startFlow()
  }

}

export default FindAndReplaceManager
