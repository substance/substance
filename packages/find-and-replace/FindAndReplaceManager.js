import { Marker } from '../../model'

class FindAndReplaceManager {

  constructor(context) {
    if (!context.editorSession) {
      throw new Error('EditorSession required.')
    }

    this.editorSession = context.editorSession
    this.editorSession.onRender('document', this._onDocumentChanged, this)

    this.doc = this.editorSession.getDocument()
    this.context = Object.assign({}, context, {
      // for convenienve we provide access to the doc directly
      doc: this.doc
    })

    this._state = {
      disabled: true,
      findString: '',
      replaceString: '',
      // Consists a sequence of property selections
      matches: [],
      selectedMatch: undefined
    }

  }

  /*
    NOTE: We remember findString and replaceString for the next search action
  */
  _resetState() {
    this._state.disabled = true
    this._state.matches = []
    this._state.selectedMatch = undefined
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
    this._propagateUpdate()
  }

  disable() {
    this._state.disabled = true
    this._resetState()
    this._propagateUpdate()
  }

  _onDocumentChanged() {
    if (!this._state.disabled) {
      this._computeMatches()
      this._state.selectedMatch = 0
      this._updateMarkers()
    }
  }

  /*
    Start find and replace workflow
  */
  startFind(findString) {
    this._state.findString = findString
    this._computeMatches()
    this._state.selectedMatch = this._getClosestMatch() || 0
    this._setSelection()
    this._propagateUpdate()
  }

  setReplaceString(replaceString) {
    // NOTE: We don't trigger any updates here
    this._state.replaceString = replaceString
  }

  /*
    Find next match. We also update the native selection here unless skipped.
    NOTE: We want to skip the selection update when hitting ENTER in the
    searchString input field. Then we just want to highlight it but keep the
    cursor in the input field.
  */
  findNext() {
    let index = this._state.selectedMatch
    let totalMatches = this._state.matches.length
    if (totalMatches === 0) return
    this._state.selectedMatch = (index + 1) % totalMatches
    this._setSelection()
    this._propagateUpdate()
  }

  _setSelection() {
    let match = this._state.matches[this._state.selectedMatch]
    if (!match) return
    this.editorSession.setSelection(match.getSelection())
  }

  /*
    Find previous match
  */
  findPrevious() {
    let index = this._state.selectedMatch
    let totalMatches = this._state.matches.length
    if (totalMatches === 0) return
    this._state.selectedMatch = index > 0 ? index - 1 : totalMatches - 1
    this._setSelection()
    this._propagateUpdate()
  }

  /*
    Replace next occurence
  */
  replaceNext() {
    let index = this._state.selectedMatch
    let match = this._state.matches[index]
    if(match !== undefined) {
      this.editorSession.transaction((tx, args) => {
        tx.setSelection(match.getSelection())
        tx.insertText(this._state.replaceString)
        return args
      })
      this._computeMatches()
      this._state.selectedMatch = index
      this._setSelection()
      this._propagateUpdate('renderSelection')
    }
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
        tx.setSelection(match.getSelection())
        tx.insertText(this._state.replaceString)
      })
      return args
    })

    this._computeMatches()
  }

  /*
    Get closest match to current cursor position
  */
  _getClosestMatch() {
    let doc = this.editorSession.getDocument()
    let nodeIds = Object.keys(doc.getNodes())
    let sel = this.editorSession.getSelection()
    let startOffset = sel.start.offset
    let selStartNode = sel.start.path[0]
    let selStartNodePos = nodeIds.indexOf(selStartNode)
    let matches = this._state.matches

    let closest = matches.findIndex(match => {
      let markerSel = match.getSelection()
      let markerStartOffset = markerSel.start.offset
      let markerStartNode = markerSel.start.path[0]
      let markerStartNodePos = nodeIds.indexOf(markerStartNode)
      if(selStartNodePos > markerStartNodePos) {
        return false
      } else if (selStartNodePos < markerStartNodePos) {
        return true
      } else {
        if(startOffset <= markerStartOffset) {
          return true
        } else {
          return false
        }
      }
    })

    return closest
  }

  _computeMatches() {
    let currentMatches = this._state.matches
    let currentTotal = currentMatches === undefined ? 0 : currentMatches.length

    this._state.matches = this._findAllMatches()

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
  _findAllMatches() {
    const doc = this.doc
    const nodes = doc.getNodes()
    const pattern = this._state.findString

    let matches = []
    if (pattern) {
      Object.keys(nodes).forEach((nodeId) => {
        let node = doc.get(nodeId)
        if(node.isText()) {
          let found = this._findInTextProperty({
            path: [node.id, 'content'],
            findString: pattern
          })
          matches = matches.concat(found)
        }
      })
    }
    return matches
  }

  /*
    Find all matches for a given search string in a text property
    Method returns an array of matches, each match is represented as
    a PropertySelection
  */
  _findInTextProperty({path, findString}) {
    const doc = this.doc
    const text = doc.get(path)

    // Case-insensitive search for multiple matches
    let matcher = new RegExp(findString, 'ig')
    let matches = []
    let match

    while ((match = matcher.exec(text))) {
      let marker = new Marker(doc, {
        type: 'match',
        start: {
          path,
          offset: match.index
        },
        end: {
          offset: matcher.lastIndex
        }
      })
      matches.push(marker)
    }
    return matches
  }

  _propagateUpdate() {
    // HACK: we make commandStates dirty in order to trigger re-evaluation
    this._updateMarkers()
    this.editorSession._setDirty('commandStates')
    this.editorSession.startFlow()
  }

  _updateMarkers() {
    const state = this._state
    const editorSession = this.editorSession
    const markersManager = editorSession.markersManager
    state.matches.forEach((m, idx) => {
      m.type = (idx === state.selectedMatch) ? 'selected-match' : 'match'
    })
    // console.log('setting find-and-replace markers', state.matches)
    markersManager.setMarkers('find-and-replace', state.matches)
  }

}

export default FindAndReplaceManager
