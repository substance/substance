import { ToggleTool } from '../../ui'

class FindAndReplaceTool extends ToggleTool {

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
              .val(commandState.findString)
              .on('change', this._startFind)
          ),
        $$('div')
          .addClass('se-section-item')
          .append(
            $$('button')
              .append('Find')
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
              .attr('placeholder', 'Replace in body')
          ),
        $$('div')
          .addClass('se-section-item')
          .append(
            $$('button')
              .append('Replace')
              .on('click', this._replaceNext)
          ),
        $$('div')
          .addClass('se-section-item')
          .append(
            $$('button')
              .append('Replace All')
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
    this.context.commandManager.executeCommand('find-next')
  }

  _replaceNext() {
    this.context.commandManager.executeCommand('replace-next')
  }

  _replaceAll() {
    this.context.commandManager.executeCommand('replace-all')
  }

  _startFind() {
    let findString = this.refs.findString.val()
    let replaceString = this.refs.replaceString.val()
    let findAndReplaceManager = this.context.editorSession.getManager('find-and-replace')
    findAndReplaceManager.startFind(findString, replaceString)
  }

}

export default FindAndReplaceTool
