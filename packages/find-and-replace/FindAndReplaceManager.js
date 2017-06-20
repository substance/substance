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

    this._dirtyNodes = []

    this._state = {
      disabled: true,
      findString: '',
      replaceString: '',
      // Consists a sequence of property selections
      matches: {},
      matchedNodes: [],
      selectedMatch: {}
    }

    // Set to indicate the desire to scroll to the selected match
    this._requestLookupMatch = false
    // Set to indicate the desire to focus and select the search string
    this._requestFocusSearchString = false
  }

  dispose() {
    this.editorSession.off(this)
  }

  /*
    NOTE: We remember findString and replaceString for the next search action
  */
  _resetState() {
    this._state.disabled = true
    this._state.matches = {}
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
      totalMatches: this._getMatchesLength(),
      selectedMatch: this._getSelectedMatchIndex()
    }
    return commandState
  }

  enable() {
    this._state.disabled = false
    this._requestFocusSearchString = true
    // Attempts to start a find immediately
    this.startFind(this._state.findString)
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
    this._state.selectedMatch = this._getClosestMatch()
    this._requestLookupMatch = true
    this._propagateUpdate(true)
    if(this._state.matchedNodes.length > 0) {
      this._setSelection()
    }
  }

  setReplaceString(replaceString) {
    // NOTE: We don't trigger any updates here
    this._state.replaceString = replaceString
  }

  /*
    Find next match.
  */
  findNext() {
    let selectedMatch = this._state.selectedMatch
    let totalMatches = this._getMatchesLength()
    if (totalMatches === 0) return
    let matches = this._state.matches
    let matchesIndex = Object.keys(matches)
    let totalNodes = matchesIndex.length 
    let selectedNodeId = selectedMatch.propertyPath
    let selectedMatchIndex = matchesIndex.indexOf(selectedNodeId)
    let currentNodeTotalMatches = this._getNodeMatchesLength(selectedNodeId)
    if(selectedMatch.matchIndex < currentNodeTotalMatches - 1) {
      this._state.selectedMatch = {
        propertyPath: selectedNodeId,
        matchIndex: selectedMatch.matchIndex + 1
      }
      this._dirtyNodes.push(selectedNodeId)
    } else if (totalNodes - 1 > selectedMatchIndex) {
      let nextNodeId = matchesIndex[selectedMatchIndex + 1]
      this._state.selectedMatch = {
        propertyPath: nextNodeId,
        matchIndex: 0
      }
      this._dirtyNodes.push(selectedNodeId, nextNodeId)
    } else {
      let firstNodeId = matchesIndex[0]
      this._state.selectedMatch = {
        propertyPath: matchesIndex[0],
        matchIndex: 0
      }
      this._dirtyNodes.push(selectedNodeId, firstNodeId)
    }
    this._requestLookupMatch = true
    this._setSelection()
    this._propagateUpdate()
  }

  /*
    Find previous match
  */
  findPrevious() {
    let selectedMatch = this._state.selectedMatch
    let totalMatches = this._getMatchesLength()
    if (totalMatches === 0) return
    let matches = this._state.matches
    let matchesIndex = Object.keys(matches)
    let selectedNodeId = selectedMatch.propertyPath
    let selectedMatchIndex = matchesIndex.indexOf(selectedNodeId)
    if(selectedMatch.matchIndex > 0) {
      this._state.selectedMatch = {
        propertyPath: selectedNodeId,
        matchIndex: selectedMatch.matchIndex - 1
      }
      this._dirtyNodes.push(selectedNodeId)
    } else if (selectedMatchIndex > 0) {
      let prevNodeId = matchesIndex[selectedMatchIndex - 1]
      this._state.selectedMatch = {
        propertyPath: prevNodeId,
        matchIndex: this._getNodeMatchesLength(prevNodeId) - 1
      }
      this._dirtyNodes.push(selectedNodeId, prevNodeId)
    } else {
      let lastNodeId = matchesIndex[matchesIndex.length - 1]
      this._state.selectedMatch = {
        propertyPath: lastNodeId,
        matchIndex: this._getNodeMatchesLength(lastNodeId) - 1
      }
      this._dirtyNodes.push(selectedNodeId, lastNodeId)
    }
    this._requestLookupMatch = true
    this._setSelection()
    this._propagateUpdate()
  }

  _setSelection() {
    let selectedMatch = this._state.selectedMatch
    let selectedPath = selectedMatch.propertyPath
    let matchIndex = selectedMatch.matchIndex
    let match = this._state.matches[selectedPath]
    let coord = match.matches[matchIndex]
    if (!match) return
    // NOTE: We need to make sure no additional flow is triggered when
    // setting the selection. We trigger a flow at the very end (_propagateUpdate)
    let sel = {
      type: 'property',
      path: match.path,
      startOffset: coord.start,
      endOffset: coord.end,
      surfaceId: match.containerId,
      containerId: match.containerId
    }
    this.editorSession.setSelection(sel, 'skipFlow')
  }

  /*
    Replace next occurence
  */
  replaceNext() {
    let index = this._state.selectedMatch
    let match = this._state.matches[index]
    let totalMatches = this._state.matches.length
    if(match !== undefined) {
      this.editorSession.transaction((tx, args) => {
        tx.setSelection(match.getSelection())
        tx.insertText(this._state.replaceString)
        return args
      })
      this._computeMatches()
      if(index + 1 < totalMatches) {
        this._state.selectedMatch = index
      }
      this._requestLookupMatch = true
      this._setSelection()
      this._propagateUpdate()
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
    let surface = this.editorSession.getFocusedSurface()
    let matches = this._state.matches
    let matchesIds = Object.keys(matches)
    let nodes = surface.getChildNodes()
    let nodeIds = nodes.map(node => {
      let dataNode = node.props.node
      if(dataNode.getTextPath) {
        let path = dataNode.getTextPath()
        return path.join('/')
      } else {
        return ''
      }
    })
    let sel = this.editorSession.getSelection()
    let closest = {}

    if(matchesIds.length > 0) {
      closest = {
        propertyPath: matchesIds[0],
        matchIndex: 0
      }
    }

    if(!sel.isNull()) {
      let selNodePath = sel.start.path
      let selNodeId = selNodePath.join('/')
      let selNodeIdIndex = matchesIds.indexOf(selNodeId)
      let selStart = sel.start.offset
      
      // There are matches inside selected node
      if(selNodeIdIndex > -1) {
        let closestNode = matches[selNodeId]
        let pos = closestNode.matches.findIndex(match => {
          return match.start > selStart
        })
        // There are matches inside selected node after selection
        if(pos > -1) {
          closest = {
            propertyPath: selNodeId,
            matchIndex: pos
          }
        // If there are no matches after selection in selected node,
        // then we should get first match from next matched node (if it is exists)
        } else if (matchesIds.length > selNodeIdIndex + 1) {
          let nodeId = matchesIds[selNodeIdIndex + 1]
          //let node = matches[nodeId]
          closest = {
            propertyPath: nodeId,
            matchIndex: 0
          }
        }
      // There are no matches inside selected node
      // We should try to find next matched nodes in the same container
      } else {
        let selNodeIndex = nodeIds.indexOf(selNodeId)
        for (let i = selNodeIndex; i < nodeIds.length; i++) {
          let nodeId = nodeIds[i]
          if(matchesIds[nodeId]) {
            closest = {
              propertyPath: nodeId,
              matchIndex: 0
            }
            break
          }
        }
      }
    }

    return closest
  }

  _computeMatches() {
    // let currentMatches = this._state.matches
    // let currentTotal = currentMatches === undefined ? 0 : Object.keys(currentMatches).length

    let newMatches = this._findAllMatches()
    this._state.matches = newMatches
    let matches = Object.keys(newMatches)
    if(matches.length > 0) {
      this._state.selectedMatch = {
        propertyPath: matches[0],
        matchIndex: 0
      }
    }
    // Preserve selection in case of the same number of matches
    // If the number of matches did changed we will set first selection
    // If there are no matches we should remove index

    // if(matches.length !== currentTotal) {
    //   this._state.selectedMatch = matches.length > 0 ? 0 : {}
    // }
  }

  /*
    Returns all matches
  */
  _findAllMatches() {
    let pattern = this._state.findString

    let matches = {}
    if (pattern) {
      let surfaceManager = this.context.surfaceManager
      let surfaces = surfaceManager.getSurfaces()

      surfaces.forEach(surface => {
        let nodes = surface.getChildNodes()

        nodes.forEach((node) => {
          let content = node.getTextContent()
          let dataNode = node.props.node
          let path = []
          if(dataNode.getPath) {
            path = dataNode.getPath()
          } else {
            path.push(surface.id, dataNode.id)
          }
          let matcher = new RegExp(pattern, 'ig')
          let nodeMatches = []
          let match

          while ((match = matcher.exec(content))) {
            nodeMatches.push({
              start: match.index,
              end: matcher.lastIndex
            })
          }

          if(nodeMatches.length > 0) {
            matches[path.join('/')] = {
              path: path,
              surfaceId: surface.id,
              containerId: surface.containerId,
              matches: nodeMatches
            }
          }
        })
      })
    }

    return matches
  }

  _propagateUpdate(start) { 
    if(start) {
      this._createMarkers()
    } else {
      this._updateMarkers()
    }
    // HACK: we make commandStates dirty in order to trigger re-evaluation
    this.editorSession._setDirty('commandStates')
    this.editorSession.startFlow()
  }

  _createMarkers() {
    const state = this._state

    for(let nodeId in state.matches) {
      if (state.matches[nodeId].hasOwnProperty('matches')) {
        this._updateNodeMarkers(nodeId)
      }
    }
  }

  _updateMarkers() {
    let dirtyNodes = this._dirtyNodes
    dirtyNodes.forEach(node => {
      this._updateNodeMarkers(node)
    })
    this._dirtyNodes = []
  }

  _updateNodeMarkers(path) {
    const state = this._state
    const editorSession = this.editorSession
    const markersManager = editorSession.markersManager
    const selectedMatch = state.selectedMatch
    const node = state.matches[path]
    let matchesMarkers = []

    node.matches.forEach((m, idx) => {
      let type = path === selectedMatch.propertyPath && selectedMatch.matchIndex === idx ? 'selected-match' : 'match'
      let marker = {
        type: type,
        surfaceId: node.surfaceId,
        start: {
          path: node.path,
          offset: m.start
        },
        end: {
          offset: m.end
        }
      }
      matchesMarkers.push(marker)
    })

    console.log('setting find-and-replace markers for path:', path, matchesMarkers)
    markersManager.setMarkers('find-and-replace:' + path, matchesMarkers)
  }

  _getMatchesLength() {
    const state = this._state
    let length = 0

    for(let nodeId in state.matches) {
      if(state.matches[nodeId]) {
        let node = state.matches[nodeId]
        let nodeMatches = node.matches
        length += nodeMatches.length
      }
    }

    return length
  }

  _getNodeMatchesLength(nodeId) {
    const state = this._state
    let nodeMatch = state.matches[nodeId]
    if(!nodeMatch) return 0
    return nodeMatch.matches.length
  }

  _getSelectedMatchIndex() {
    let selectedMatch = this._state.selectedMatch
    let matches = this._state.matches
    let index = 0
    if(!selectedMatch.propertyPath) return index

    for(let nodeId in matches) {
      if(matches[nodeId]) {
        if(selectedMatch.propertyPath === nodeId) break

        let node = matches[nodeId]
        let nodeMatches = node.matches
        index += nodeMatches.length
      }
    }

    index += selectedMatch.matchIndex + 1

    return index
  }
}

export default FindAndReplaceManager
