import Tool from '../tools/Tool'
import insertText from '../../model/transform/insertText'

class CorrectionTool extends Tool {

  render($$) {
    let node = this.props.node
    let Button = this.getComponent('button')
    let el = $$('div').addClass('sc-correction-tool')

    if (node && node.suggestions.length > 0) {
      node.suggestions.forEach((s) => {
        el.append(
          $$(Button, {
            label: s,
            style: this.props.style
          }).attr('title', this.getLabel('open-link'))
            .attr('data-correction', s)
            .on('click', this._applyCorrection.bind(this, s))
        )
      })
    } else {
      el.append(
        $$(Button, {
          label: 'No suggestions',
          style: this.props.style,
          disabled: true
        })
      )
    }
    return el
  }

  _applyCorrection(suggestion) {
    let editorSession = this.context.editorSession
    editorSession.transaction(function(tx, args) {
      return insertText(tx, {
        selection: args.selection,
        text: suggestion
      })
    })
  }
}

export default CorrectionTool
