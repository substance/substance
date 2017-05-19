
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
      active: false,
      findString: '',
      replaceString: '',
      matches: []
    }
  }

  /*
    Used to display 4 of 10

    TODO: implement based on this._state.matches
  */
  getResultCounter() {
    return {
      total: 10,
      selected: 4
    }
  }

  getState() {
    return this._state
  }

  /*
    Start find and replace workflow
  */
  startFind(findString, replaceString) {
    this._state.findString = findString
    this._state.replaceString = replaceString
  }

  findNext() {

  }

  findPrevious() {

  }

  findAll() {

  }

  replaceNext() {

  }

  replaceAll() {

  }

}

export default FindAndReplaceManager
