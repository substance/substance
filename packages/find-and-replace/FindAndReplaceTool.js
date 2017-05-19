import { ToggleTool } from '../../ui'

class FindAndReplaceTool extends ToggleTool {

  render($$) {
    let el = $$('div').addClass('sc-find-and-replace-tool')

    el.append(
      $$('div').addClass('se-status').append(
        $$('div').addClass('se-status-description').append(
          '1 results for "hello"'
        ),
        $$('div').addClass('se-status-options').append(
          $$('span').addClass('sm-light').append(
            'Finding with Options: '
          ),
          'Case Insensitive'
        ),
        $$('button').append('X'),
        $$('button').append('Y'),
        $$('button').append('Z'),
        $$('button').append('A')
      ),
      $$('div').addClass('se-section').append(
        $$('div')
          .addClass('se-section-item')
          .addClass('sm-flex')
          .append(
            $$('input')
              .attr('type', 'text')
              .attr('placeholder', 'Find in body')
          ),
        $$('div')
          .addClass('se-section-item')
          .append(
            $$('button').append('Find')
          ),
        $$('div')
          .addClass('se-section-item')
          .append(
            $$('button').append('Find All')
          )
      ),
      $$('div').addClass('se-section').append(
        $$('div')
          .addClass('se-section-item')
          .addClass('sm-flex')
          .append(
            $$('input')
              .attr('type', 'text')
              .attr('placeholder', 'Replace in body')
          ),
        $$('div')
          .addClass('se-section-item')
          .append(
            $$('button').append('Replace')
          ),
        $$('div')
          .addClass('se-section-item')
          .append(
            $$('button').append('Replace All')
          )
      )
    )
    return el
  }
}

export default FindAndReplaceTool
