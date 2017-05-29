
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

    this._computeMatches()
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
    this._state.selectedMatch = index > 0 ? index - 1 : totalMatches - 1
    this._propagateUpdate()
  }

  /*
    Replace next occurence
  */
  replaceNext() {
    let index = this._state.selectedMatch
    let totalMatches = this._state.matches.length
    let match = this._state.matches[index]
    let next = (index + 1) % totalMatches
    let nextMatch = this._state.matches[next]

    this.editorSession.transaction((tx, args) => {
      tx.setSelection(match)
      tx.insertText(this._state.replaceString)
      tx.setSelection(nextMatch)
      return args
    })

    this._computeMatches()
  }

  /*
    Replace all occurences
  */
  replaceAll() {
    // Reverse matches order, 
    // so the replace operations later are side effect free. 
    let matches = this._state.matches.reverse()

    this.editorSession.transaction((tx, args) => {
      matches.forEach(match => {
        tx.setSelection(match)
        tx.insertText(this._state.replaceString)
      })
      return args
    })

    this._computeMatches()
  }

  _computeMatches() {
    let currentMatches = this._state.matches
    let currentTotal = currentMatches === undefined ? 0 : currentMatches.length

    this.editorSession.transaction((tx, args) => {
      this._state.matches = this._findAllMatches(tx)
      return args
    })

    // Preserve selection in case of the same number of matches
    // If the number of matches did changed we will set first selection
    // If there are no matches we should remove index
    let newMatches = this._state.matches

    if(newMatches.length !== currentTotal) {
      this._state.selectedMatch = newMatches.length > 0 ? 0 : undefined
    }
  }

  /*
    Returns all matches
  */
  _findAllMatches(tx) {
    let matches = []
    const nodes = this.doc.getNodes()

    Object.keys(nodes).forEach((nodeId) => {
      let node = this.doc.get(nodeId)
      if(node.isText()) {
        let found = this._findInTextProperty(tx, {path: [node.id, 'content'], findString: this._state.findString})
        matches = matches.concat(found)
      }
    })

    return matches
  }

  /*
    Find all matches for a given search string in a text property
    Method returns an array of matches, each match is represented as
    a PropertySelection
  */
  _findInTextProperty(tx, args) {
    const text = tx.get(args.path)

    // Case-insensitive search for multiple matches
    let matcher = new RegExp(args.findString, 'ig')
    let matches = []
    let match

    while ((match = matcher.exec(text))) {
      let sel = tx.createSelection({
        type: 'property',
        path: args.path,
        startOffset: match.index,
        endOffset: matcher.lastIndex
      })
      matches.push(sel)
    }
    return matches
  }

  _propagateUpdate() {
    let selectedMatch = this._state.selectedMatch
    this.editorSession.transaction((tx, args) => {
      let selection = this._state.matches[selectedMatch]
      tx.setSelection(selection)
      args.selection = selection
      return args
    })
    // HACK: we make commandStates dirty in order to trigger re-evaluation
    this.editorSession._setDirty('commandStates')
    this.editorSession.startFlow()
  }

}

export default FindAndReplaceManager
