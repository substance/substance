import { ToggleTool } from '../../ui'

class FindAndReplaceTool extends ToggleTool {

  didMount() {
    this.refs.findString.el.focus()
    this.context.editorSession.onPostRender(this._onPostRender, this)
  }

  dispose() {
    this.context.editorSession.off(this)
  }

  _onPostRender() {
    this._scrollToSelectedMatch()
  }

  render($$) {
    let commandState = this.props.commandState
    let el = $$('div').addClass('sc-find-and-replace-tool')

    el.append(
      this._renderStatusDescription($$),
      // TODO: enable status options (case-insensitive search / regexp etc.)
      // $$('div').addClass('se-status-options').append(
      //   $$('span').addClass('sm-light').append(
      //     'Finding with Options: '
      //   ),
      //   'Case Insensitive'
      // ),
      // $$('button').append('X'),
      // $$('button').append('Y'),
      // $$('button').append('Z'),
      // $$('button').append('A')
      $$('div').addClass('se-section').append(
        $$('div')
          .addClass('se-section-item se-find-input')
          .addClass('sm-flex')
          .append(
            $$('input')
              .ref('findString')
              .attr('type', 'text')
              .attr('placeholder', 'Find in body')
              .attr('tabindex', 500)
              .val(commandState.findString)
              .on('keyup', this._triggerFind)
              .on('focus', this._onFocus)
              .on('blur', this._onBlur),
            this._renderStatusCounter($$)
          ),
        $$('div')
          .addClass('se-section-item se-replace-input')
          .append(
            $$('button')
              .append('Find')
              .attr('tabindex', 502)
              .on('click', this._findNext)
          ),
        $$('div')
          .addClass('se-section-item')
          // .append(
          //   $$('button').append('Find All')
          // )
      ),
      $$('div').addClass('se-section').append(
        $$('div')
          .addClass('se-section-item')
          .addClass('sm-flex')
          .append(
            $$('input')
              .ref('replaceString')
              .val(commandState.replaceString)
              .attr('type', 'text')
              .attr('tabindex', 501)
              .attr('placeholder', 'Replace in body')
              .on('focus', this._onFocus)
              .on('blur', this._onBlur)
              .on('keyup', this._triggerReplace)
          ),
        $$('div')
          .addClass('se-section-item')
          .append(
            $$('button')
              .append('Replace')
              .attr('tabindex', 503)
              .on('click', this._replaceNext)
          ),
        $$('div')
          .addClass('se-section-item')
          .append(
            $$('button')
              .append('Replace All')
              .attr('tabindex', 504)
              .on('click', this._replaceAll)
          )
      )
    )
    return el
  }

  _renderStatusDescription($$) {
    let commandState = this.props.commandState
    let statusDescriptionEl = $$('div').addClass('se-status').append(
      $$('div').addClass('se-status-title').append(
        this.getLabel('find-and-replace-title')
      )
    )

    if (commandState.totalMatches > 0) {
      statusDescriptionEl.append(
        $$('div').addClass('se-status-description').append(
          commandState.totalMatches,
          ' results found for ',
          '"'+ commandState.findString +'"'
        )
      )
    } else if (commandState.findString !== '') {
      statusDescriptionEl.append(
        $$('div').addClass('se-status-description').append(
          'No results found for ',
          '"'+ commandState.findString +'"'
        )
      )
    } else {
      statusDescriptionEl.append(
        $$('div').addClass('se-status-description').append(
          'Close this panel with ESC key'
        )
      )
    }
    return statusDescriptionEl
  }

  /*
    We disable selection rendering in the surface, while our tool has the focus
  */
  _onFocus() {
    let editorSession = this.context.editorSession
    editorSession.setBlurred(true)
  }

  /*
    Re-enable selection rendering in surface
  */
  _onBlur() {
    let editorSession = this.context.editorSession
    editorSession.setBlurred(false)
  }

  _renderStatusCounter($$) {
    let commandState = this.props.commandState
    let statusCounterEl

    if (commandState.totalMatches > 0) {
      statusCounterEl = $$('span').addClass('se-status-counter').append(
        [commandState.selectedMatch, commandState.totalMatches].join(' of ')
      )
    }

    return statusCounterEl
  }

  _findNext() {
    let findAndReplaceManager = this.context.editorSession.getManager('find-and-replace')
    findAndReplaceManager.findNext()
  }

  _replaceNext() {
    let findAndReplaceManager = this.context.editorSession.getManager('find-and-replace')
    findAndReplaceManager.replaceNext()
  }

  _replaceAll() {
    let findAndReplaceManager = this.context.editorSession.getManager('find-and-replace')
    findAndReplaceManager.replaceAll()
  }

  /*
    Either starts a new find (when a new character is inserted) or finds the
    next match (when ENTER is hit)

    TODO: it would be good to debounce this (trigger new find only every 500ms
    of inactivity)
  */
  _triggerFind(e) {
    if (this.findStringHasChanged()) {
      this._startFind()
    } else if (e.keyCode === 13) {
      this._findNext()
    }
  }

  /*
    Returns true if keyboard event is a text input
  */
  _isInput(e) {
    return e.keyCode >= 65 || e.keyCode === 32
  }

  findStringHasChanged() {
    let findString = this.refs.findString.val()
    let previousFindString = this._previousFindString
    this._previousFindString = findString
    return findString !== previousFindString
  }

  /*
    Starts a new find operations.

    All matches are highlighted in the document and the first one is selected.
  */
  _startFind() {
    let findString = this.refs.findString.val()

    let findAndReplaceManager = this.context.editorSession.getManager('find-and-replace')
    findAndReplaceManager.startFind(findString)
  }

  _scrollToSelectedMatch() {
    let editorSession = this.context.editorSession
    let surface = editorSession.getFocusedSurface()
    surface.context.scrollPane.scrollTo('.sc-selected-match', 'onlyIfNotVisible')
  }

  /*
    Either updates the replaceString (when a new character is inserted) or
    starts a replace action (when ENTER is hit)
  */
  _triggerReplace(e) {
    if (e.keyCode === 13) {
      this._replaceNext()
    } else {
      this._setReplaceString()
    }
  }

  /*
    Just sets the replace string in findAndReplaceManager state

    NOTE: no flow is triggered here
  */
  _setReplaceString() {
    let replaceString = this.refs.replaceString.val()
    let findAndReplaceManager = this.context.editorSession.getManager('find-and-replace')
    findAndReplaceManager.setReplaceString(replaceString)
  }

}

export default FindAndReplaceTool
