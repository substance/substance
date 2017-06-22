class FindAndReplaceManager {

  constructor(context) {
    if (!context.editorSession) {
      throw new Error('EditorSession required.')
    }

    this.editorSession = context.editorSession
    this.editorSession.onUpdate('document', this._onDocumentChanged, this)

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

  _onDocumentChanged(change) {
    if (!this._state.disabled) {
      let ops = change.ops
      ops.forEach(op => {
        let path = op.path
        this._dirtyNodes.push(path.join('/'))
      })
      this._updateMatchesAndMarkers()
    }
  }

  setReplaceString(replaceString) {
    // NOTE: We don't trigger any updates here
    this._state.replaceString = replaceString
  }

  // FIND ACTIONS
  // ============

  /*
    Start find and replace workflow
  */
  startFind(findString) {
    this._state.findString = findString
    this._computeMatches()
    this._state.selectedMatch = this._getClosestMatch()
    this._requestLookupMatch = true
    this._propagateUpdate(true)
    if(this._getMatchesLength() > 0) {
      this._setSelection()
    }
  }

  /*
    Find next match
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

  // REPLACE ACTIONS
  // ===============

  /*
    Replace next occurence
  */
  replaceNext() {
    let selectedMatch = this._state.selectedMatch
    let matchedNode = this._state.matches[selectedMatch.propertyPath]
    let matchedNodeLength = this._getNodeMatchesLength(selectedMatch.propertyPath)
    if(matchedNode !== undefined) {
      let match = matchedNode.matches[selectedMatch.matchIndex]
      let sel = {
        type: 'property',
        path: matchedNode.path,
        startOffset: match.start,
        endOffset: match.end,
        surfaceId: matchedNode.containerId,
        containerId: matchedNode.containerId
      }
      this.editorSession.transaction((tx, args) => {
        tx.setSelection(sel)
        tx.insertText(this._state.replaceString)
        return args
      })
      this._dirtyNodes.push(selectedMatch.propertyPath)
      //this._computeMatches()
      if(selectedMatch.matchIndex < matchedNodeLength - 1) {
        //this._state.selectedMatch.matchIndex
      } else {
        let nextMatchedNodeId = this._getNextMatchedNodeId(selectedMatch.propertyPath)
        if(nextMatchedNodeId) {
          this._state.selectedMatch = {
            propertyPath: nextMatchedNodeId,
            matchIndex: 0
          }
        }
      }
      this._requestLookupMatch = true
      this._propagateUpdate()
      this._setSelection()
    }
  }

  /*
    Replace all occurences
  */
  replaceAll() {
    // Reverse matches order,
    // so the replace operations later are side effect free.
    let matches = this._state.matches
    let matchedNodes = Object.keys(matches).reverse()

    this.editorSession.transaction((tx, args) => {
      matchedNodes.forEach(nodeId => {
        let match = matches[nodeId]
        let matchesLength = match.matches.length
        let i = matchesLength
        
        while(i !== 0) {
          i--
          let coord = match.matches[i]
          let sel = {
            type: 'property',
            path: match.path,
            startOffset: coord.start,
            endOffset: coord.end,
            surfaceId: match.containerId,
            containerId: match.containerId
          }
          tx.setSelection(sel)
          tx.insertText(this._state.replaceString)
        }

        this._dirtyNodes.push(nodeId)
      })
      return args
    })

    this._state.selectedMatch = {}
    this._propagateUpdate()
  }

  // MARKERS HANDLING
  // ================

  _createMarkers() {
    const state = this._state

    for(let nodeId in state.matches) {
      if (state.matches[nodeId].hasOwnProperty('matches')) {
        this._updateMarkers(nodeId)
      }
    }
  }

  _updateMarkers(path) {
    const state = this._state
    const editorSession = this.editorSession
    const markersManager = editorSession.markersManager
    const selectedMatch = state.selectedMatch
    const node = state.matches[path]
    let matchesMarkers = []

    if(node) {
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

      markersManager.setMarkers('find-and-replace:' + path, matchesMarkers)
    }
  }

  // MATCHES COMPUTATION
  // ===================

  _computeMatches() {
    let newMatches = this._findAllMatches()
    this._state.matches = newMatches
    let matches = Object.keys(newMatches)
    if(matches.length > 0) {
      this._state.selectedMatch = {
        propertyPath: matches[0],
        matchIndex: 0
      }
    } else {
      this._state.selectedMatch = {}
    }
  }

  /*
    Returns all matches
  */
  _findAllMatches() {
    let matches = {}
    let pattern = this._state.findString

    if (pattern) {
      let surfaceManager = this.editorSession.surfaceManager
      let surfaces = surfaceManager.getSurfaces()

      surfaces.forEach(surface => {
        let nodes = surface.getChildNodes()

        nodes.forEach((node) => {
          let matchedNode = this._findNodeMatches(node, surface)
          if(matchedNode) {
            let path = matchedNode.path
            matches[path.join('/')] = matchedNode
          }
        })
      })
    }

    return matches
  }

  /*
    Compute matches for a given node and surface
  */
  _findNodeMatches(node, surface) {
    let pattern = this._state.findString
    let content = node.getTextContent()
    let dataNode = node.props.node
    if(dataNode.isText()) {
      if(!surface) surface = node.context.surface
      let path = dataNode.getTextPath()
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
        return {
          path: path,
          surfaceId: surface.id,
          containerId: surface.containerId,
          matches: nodeMatches
        }
      }
    }

    return false
  }

  // HELPERS
  // =======

  _propagateUpdate(start) { 
    if(start) {
      this._createMarkers()
    } else {
      this._updateMatchesAndMarkers()
    }
    // HACK: we make commandStates dirty in order to trigger re-evaluation
    this.editorSession._setDirty('commandStates')
    this.editorSession.startFlow()
  }

  _updateMatchesAndMarkers() {
    let surfaceManager = this.editorSession.surfaceManager
    let matches = this._state.matches
    let dirtyNodes = this._dirtyNodes
    dirtyNodes.forEach(nodeId => {
      let matchedNode = matches[nodeId]
      let surface = surfaceManager.getSurface(matchedNode.surfaceId)
      let node = surface.refs[matchedNode.path[0]]
      let nodeMatches = this._findNodeMatches(node)
      if(nodeMatches) {
        matches[nodeId] = nodeMatches
      } else {
        delete matches[nodeId]
      }
      this._updateMarkers(nodeId)
    })
    this._dirtyNodes = []
  }

  /*
    Set selection on selected match
  */
  _setSelection() {
    let selectedMatch = this._state.selectedMatch
    let selectedPath = selectedMatch.propertyPath
    let matchIndex = selectedMatch.matchIndex
    let match = this._state.matches[selectedPath]
    if (!match) return
    let coord = match.matches[matchIndex]
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
          return match.start >= selStart
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
          let nodeId = this._getNextMatchedNodeId(selNodeId)
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

  /*
    Returns number of all matches
  */
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

  /*
    Returns number of matches for a given property path
  */
  _getNodeMatchesLength(nodeId) {
    const state = this._state
    let nodeMatch = state.matches[nodeId]
    if(!nodeMatch) return 0
    return nodeMatch.matches.length
  }

  /*
    Returns index of currently selected match
  */
  _getSelectedMatchIndex() {
    let selectedMatch = this._state.selectedMatch
    let matches = this._state.matches
    let index = 0
    if(!selectedMatch.propertyPath) return undefined

    for(let nodeId in matches) {
      if(matches[nodeId]) {
        if(selectedMatch.propertyPath === nodeId) break

        let node = matches[nodeId]
        let nodeMatches = node.matches
        index += nodeMatches.length
      }
    }

    index += selectedMatch.matchIndex

    return index
  }

  /*
    Returns id of next node with matches or false if there is no one
  */
  _getNextMatchedNodeId(propertyPath) {
    let matches = this._state.matches
    let matchesKeys = Object.keys(matches)
    let currentIndex = matchesKeys.indexOf(propertyPath)

    if(matchesKeys.length === currentIndex + 1) {
      if(matchesKeys.length > 1) {
        return matchesKeys[0]
      } else {
        return false
      }
    }

    let nextNodeId = matchesKeys[currentIndex + 1]
    return nextNodeId
  }

}

export default FindAndReplaceManager
