import { ToggleTool } from '../../ui'

class FindAndReplaceTool extends ToggleTool {

  didMount() {
    this.refs.findString.el.focus()
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
          .addClass('se-section-item')
          .addClass('sm-flex')
          .append(
            $$('input')
              .ref('findString')
              .attr('type', 'text')
              .attr('placeholder', 'Find in body')
              .attr('tabindex', 500)
              .val(commandState.findString)
              .on('keyup', this._triggerFind)
          ),
        $$('div')
          .addClass('se-section-item')
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
    let statusDescriptionEl

    if (commandState.totalMatches > 0) {
      statusDescriptionEl = $$('div').addClass('se-status-description').append(
        commandState.totalMatches,
        ' results found for ',
        '"'+ commandState.findString +'"',
        '(',
        [commandState.selectedMatch, commandState.totalMatches].join('/'),
        ')'
      )
    } else if (commandState.findString !== '') {
      statusDescriptionEl = $$('div').addClass('se-status-description').append(
        'No results found for ',
        '"'+ commandState.findString +'"'
      )
    } else {
      statusDescriptionEl = $$('div').addClass('se-status-description').append(
        'Find and replace'
      )
    }
    return statusDescriptionEl
  }

  _findNext() {
    let findAndReplaceManager = this.context.editorSession.getManager('find-and-replace')
    findAndReplaceManager.findNext()
    this._scrollToSelectedMatch()
  }

  _replaceNext() {
    let findAndReplaceManager = this.context.editorSession.getManager('find-and-replace')
    findAndReplaceManager.replaceNext()
    this._scrollToSelectedMatch()
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
    this._scrollToSelectedMatch()
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