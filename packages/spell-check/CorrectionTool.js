import Tool from '../tools/Tool'

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
    let node = this.props.node
    editorSession.transaction((tx) => {
      let sel = tx.getSelection()
      tx.setSelection({
        type: 'property',
        path: node.start.path,
        startOffset: node.start.offset,
        endOffset: node.end.offset,
        containerId: sel.containerId
      })
      tx.insertText(suggestion)
    })
  }
}

export default CorrectionTool
