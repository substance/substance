import { debounce, uuid, platform, getKeyForPath } from '../util'
import { documentHelpers, Marker } from '../model'

const UPDATE_DELAY = 200

export default class FindAndReplaceManager {
  constructor (editorSession) {
    this._editorSession = editorSession
    this._doc = editorSession.getDocument()
    this._dirty = new Set()

    // Note: this is debounced to avoid slow down while typing by running searches too eagerly
    // Only for testing search updates are done synchronously
    this._updateSearchDebounced = debounce(this._updateSearch.bind(this, true), UPDATE_DELAY)

    let editorState = this._editorSession.getEditorState()
    // during update stage we watch for changes on properties with matches
    // to keep the internal state up2date
    editorState.addObserver(['document'], this._onUpdate, this, { stage: 'update' })
    // HACK: without this we see strange errors. As a temporary fix leave it here
    // but should try tor find the source of the problem ASAP
    editorState.addObserver(['document'], this._onRender, this, { stage: 'render' })
  }

  dispose () {
    this._editorSession.getEditorState().removeObserver(this)
  }

  openDialog (enableReplace) {
    enableReplace = Boolean(enableReplace)
    let state = this._getState()
    if (state.enabled) {
      // update state if 'showReplace' has changed
      if (state.showReplace !== enableReplace) {
        state.showReplace = Boolean(enableReplace)
        this._updateState(state)
      }
    } else {
      state.enabled = true
      state.showReplace = Boolean(enableReplace)
      // resetting dirty flags as we do a full search initially
      this._dirty = new Set()
      this._performSearch()
    }
    this._propgateUpdates()
  }

  closeDialog () {
    let state = this._getState()
    if (!state.enabled) return
    state.enabled = false
    this._clearHighlights()
    // Note: recovering the selection here
    this._updateState(state, 'recoverSelection')
    this._propgateUpdates()
  }

  next () {
    this._next()
    this._propgateUpdates()
  }

  previous () {
    let state = this._getState()
    this._nav('back')
    this._updateState(state)
    this._propgateUpdates()
  }

  setSearchPattern (pattern) {
    let state = this._getState()
    if (state.pattern !== pattern) {
      state.pattern = pattern
      this._performSearch()
      this._propgateUpdates()
    }
  }

  setReplacePattern (replacePattern) {
    let state = this._getState()
    if (state.replacePattern !== replacePattern) {
      state.replacePattern = replacePattern
      this._updateState(state)
      this._propgateUpdates()
    }
  }

  replaceNext () {
    let state = this._getState()
    // ATTENTION: special handling after manual changes, while search dialog is open
    // in this case we do a forced 'next()' when using 'replaceNext()'
    if (state._forceNav) {
      state._forceNav = false
      this._next()
      return
    }
    if (state.replacePattern) {
      let hasReplaced = false
      if (state.cursor >= 0) {
        let m = this._getMatchAt(state.cursor)
        if (m) {
          this._editorSession.transaction(tx => {
            this._replace(tx, m, state)
          }, { action: 'replace' })
          // ATTENTION: we are not changing the search result on changes with action type: 'replace'
          // Instead we are doing it here manually:
          // updating the result for the current text property
          // and propagating changes so that so that text properties are updated
          this._updateSearchForProperty(getKeyForPath(m.path))
          this._editorSession.getEditorState().propagateUpdates()
          // set the cursor back and scroll to the next
          state.cursor--
          this._nav('forward')
          this._updateState(state)
          hasReplaced = true
        }
      }
      if (!hasReplaced) {
        // otherwise seek to the next match position first
        this._next()
      }
      this._propgateUpdates()
    }
  }

  replaceAll () {
    let state = this._getState()
    if (!state.matches) return
    let allMatches = []
    state.matches.forEach(_matches => {
      allMatches = allMatches.concat(_matches)
    })
    this._editorSession.transaction(tx => {
      for (let idx = allMatches.length - 1; idx >= 0; idx--) {
        this._replace(tx, allMatches[idx], state)
      }
    }, { action: 'replace-all' })
    state.matches = new Map()
    state.count = 0
    state.cursor = -1
    this._updateState(state)
    this._propgateUpdates()
  }

  toggleCaseSensitivity () {
    this._toggleOption('caseSensitive')
    this._propgateUpdates()
  }

  toggleRegexSearch () {
    this._toggleOption('regexSearch')
    this._propgateUpdates()
  }

  toggleFullWordSearch () {
    this._toggleOption('fullWord')
    this._propgateUpdates()
  }

  _getMarkersManager () {
    return this._editorSession.markersManager
  }

  _getState () {
    return this._editorSession.getEditorState().get('findAndReplace') || FindAndReplaceManager.defaultState()
  }

  _toggleOption (optionName) {
    let state = this._getState()
    state[optionName] = !state[optionName]
    this._performSearch()
  }

  _performSearch () {
    let state = this._getState()
    if (state.pattern) {
      this._searchAndHighlight()
    } else {
      this._clear()
    }
    state.cursor = -1
    this._updateState(state)
    // ATTENTION: scrolling to the first match (if available)
    // this needs to be done after rolling out the state update
    // so that the markers have been rendered already
    if (state.count > 0) {
      this._next()
    }
  }

  _next () {
    let state = this._getState()
    this._nav('forward')
    this._updateState(state)
  }

  _updateState (state, recoverSelection) {
    const editorState = this._editorSession.getEditorState()
    // HACK: touching editorState.selection because we want that the applications recovers the selection
    if (recoverSelection) {
      editorState._setDirty('selection')
    }
    // console.log('Updating editorState.findAndReplace', state)
    editorState.set('findAndReplace', state)
  }

  _propgateUpdates () {
    const editorState = this._editorSession.getEditorState()
    // TODO: we need to figure out if this is a problem
    // only in tests this is called synchronously
    // leading to extra updates e.g. when the content is changed while
    // the FNR dialog is open
    if (!editorState._isUpdating()) {
      this._editorState.propagateUpdates()
    }
  }

  _searchAndHighlight () {
    // re-start the search
    this._clearHighlights()
    this._search()
    this._addHighlights()
    this._propgateUpdates()
  }

  _search () {
    let state = this._getState()
    let matches = new Map()
    let count = 0
    let pattern = state.pattern
    let opts = state
    if (pattern) {
      let tps = this._getTextProperties()
      for (let tp of tps) {
        // console.log('... searching for matches in ', tp.getPath())
        let _matches = this._searchInProperty(tp, pattern, opts)
        // if (_matches.length > 0) console.log('found %s matches', _matches.length)
        count += _matches.length
        if (_matches.length > 0) {
          matches.set(getKeyForPath(tp.getPath()), _matches)
        }
      }
    }
    state.matches = matches
    state.count = count
  }

  _updateSearch (propagate) {
    let state = this._getState()
    if (!state.enabled || !state.pattern || this._dirty.size === 0) return

    for (let key of this._dirty) {
      // ATTENTION: this updates state.count
      this._updateSearchForProperty(key)
    }
    // HACK: need to make sure that the selection is recovered here
    this._updateState(state, 'recoverSelection')
    this._dirty = new Set()
    if (propagate) {
      this._propgateUpdates()
    }
  }

  _updateSearchForProperty (key) {
    let markersManager = this._getMarkersManager()
    let state = this._getState()
    let matches = state.matches
    let count = state.count
    let _matches = matches.get(key)
    if (_matches) {
      count -= _matches.length
    }
    let path = key.split('.')
    markersManager.clearMarkers(path, m => m.type === 'find-marker')
    let tp = this._getTextProperty(key)
    if (tp) {
      _matches = this._searchInProperty(tp, state.pattern, state)
      count += _matches.length
      matches.set(key, _matches)
      this._addHighlightsForProperty(path, _matches)
    } else {
      matches.delete(key)
    }
    state.count = count
  }

  _searchInProperty (tp, pattern, opts) {
    let path = tp.getPath()
    return _findInText(tp.getText(), pattern, opts).map(m => {
      // add an id so that we can find it later, e.g. for scroll-to
      m.id = uuid()
      m.path = path
      m.textProperty = tp
      return m
    })
  }

  /*
    In case of a regexp search the replacement string allows for the following patterns
    - "$$": Inserts a "$".
    - "$&": Inserts the matched substring.
    - "$`": Inserts the portion of the string that precedes the matched substring.
    - "$'": Inserts the portion of the string that follows the matched substring.
    - "$n": Where n is a positive integer less than 100, inserts the nth parenthesized submatch string, provided the first argument was a RegExp object. Note that this is 1-indexed.
  */
  _replace (tx, m, options) {
    tx.setSelection({
      type: 'property',
      path: m.path,
      startOffset: m.start,
      endOffset: m.end
    })
    let newText
    // TODO: we should allow to use regex in replace string too
    // for that we would take the string from the match
    // and apply native String replace to g
    if (options.regexSearch) {
      let text = documentHelpers.getTextForSelection(tx, tx.selection)
      let findRe = new RegExp(options.pattern)
      newText = text.replace(findRe, options.replacePattern)
    } else {
      newText = options.replacePattern
    }
    tx.insertText(newText)
  }

  _clear () {
    let state = this._getState()
    this._clearHighlights()
    state.matches = new Map()
    state.count = 0
  }

  _clearHighlights () {
    const markersManager = this._getMarkersManager()
    const state = this._getState()
    if (state.matches) {
      state.matches.forEach((_, key) => {
        let path = key.split('.')
        markersManager.clearMarkers(path, m => m.type === 'find-marker')
      })
    }
  }

  _addHighlights () {
    const state = this._getState()
    if (state.matches) {
      state.matches.forEach((matches, key) => {
        let path = key.split('.')
        this._addHighlightsForProperty(path, matches)
      })
    }
  }

  // TODO: don't know yet how we want to update Markers incrementally
  _addHighlightsForProperty (path, matches) {
    let markersManager = this._getMarkersManager()
    matches.forEach(m => {
      markersManager.addMarker(new Marker(this._doc, {
        type: 'find-marker',
        id: m.id,
        start: {
          path,
          offset: m.start
        },
        end: {
          path,
          offset: m.end
        }
      }))
    })
  }

  _getTextProperties () {
    let rootComponent = this._editorSession.getRootComponent()
    if (rootComponent) {
      // EXPERIMENTAL: we need to retrieve all *editable* text properties in the correct order
      // which is not possible just from the model (without further knowledge)
      // However, doing it via DOM search is probably rather slow
      return rootComponent.findAll('.sc-text-property')
    } else {
      console.error('FindAndReplaceManager: no root component has been assigned yet.')
    }
  }

  _getTextProperty (id) {
    let rootComponent = this._editorSession.getRootComponent()
    if (rootComponent) {
      // EXPERIMENTAL: same as _getTextProperties()
      return rootComponent.find(`.sc-text-property[data-path="${id}"]`)
    } else {
      console.error('FindAndReplaceManager: no root component has been assigned yet.')
    }
  }

  _nav (direction) {
    let state = this._getState()
    let [cursor, match] = this._getNext(direction)
    if (match) {
      state.cursor = cursor
      this._scrollToMatch(match)
    }
  }

  _getNext (direction) {
    // TODO: support a selection relative navigation
    // as a first iteration we will do this independently from the selection
    let state = this._getState()
    let idx
    if (direction === 'forward') {
      idx = Math.min(state.count - 1, state.cursor + 1)
    } else {
      idx = Math.max(0, state.cursor - 1)
    }
    return [ idx, this._getMatchAt(idx) ]
  }

  _getMatchAt (idx) {
    // Note: because we are storing matching grouped by properties
    // this is a but nasty
    let state = this._getState()
    if (state.matches) {
      for (let [, matches] of state.matches) {
        if (idx >= matches.length) {
          idx -= matches.length
        } else {
          return matches[idx]
        }
      }
    }
  }

  _scrollToMatch (match) {
    let state = this._getState()
    // HACKIDHACK: instead of relying on rerendering, we toggle the hightlight here
    // which is also much faster, and still pretty safe, because we throw markers on every change
    if (state.marker) state.marker.el.removeClass('sm-active')
    let tp = match.textProperty
    let marker = tp.find(`.sm-find-marker[data-id="${match.id}"]`)
    // FIXME: when doing replace it seems that we are not good yet with navigating through the matches
    // this guard should not be necessary if everything is working
    if (marker) {
      marker.el.addClass('sm-active')
      state.marker = marker
      tp.send('scrollElementIntoView', marker.el)
    }
  }

  _onUpdate (change) {
    // skip changes caused by replaceNext() and replaceAll()
    if (
      change.info.action === 'replace' ||
      change.info.action === 'replace-all' ||
      change.info.action === 'nop'
    ) return
    for (let op of change.ops) {
      if (op.isUpdate() && op.diff._isTextOperation) {
        this._dirty.add(getKeyForPath(op.path))
      }
    }
    let state = this._getState()
    if (!state.enabled) return

    // HACK: this is a bit hacky but should work. When the user has changed the text we leave a mark in the state
    // so that we can force a 'next()' when 'replaceNext()' is called
    state._forceNav = true
    // Note: when running tests updating the search result synchronously
    if (platform.test) {
      this._updateSearch()
    } else {
      // otherwise this is done debounced
      this._updateSearchDebounced()
    }
  }

  _onRender (change) {
    // HACK: There seems to be a problem with registering observers in the editorState
    // without registering this hook we see strange errors at other places
    // Probably related to a bug in the observer registration/deregistration
    // during propagation of AppState changes
  }

  static defaultState () {
    return {
      enabled: false,
      pattern: '',
      showReplace: false,
      replacePattern: '',
      caseSensitive: false,
      fullWord: false,
      regexSearch: false,
      matches: null,
      count: 0,
      cursor: 0
    }
  }
}

function _createRegExForPattern (pattern) {
  return pattern.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, '\\$&') // eslint-disable-line no-useless-escape
}

function _findInText (text, pattern, opts = {}) {
  if (!opts.regexSearch) {
    pattern = _createRegExForPattern(pattern)
  }
  if (opts.fullWord) {
    pattern = '\\b' + pattern + '\\b'
  }
  let matches = []
  try {
    let matcher = new RegExp(pattern, opts.caseSensitive ? 'g' : 'gi')
    let match
    while ((match = matcher.exec(text))) {
      matches.push({
        start: match.index,
        end: matcher.lastIndex
      })
    }
  } catch (err) {}
  return matches
}
