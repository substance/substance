import { Tool } from '../../ui'

const TEXT_ALIGNMENTS = ['left', 'center', 'right']

class TextAlignTool extends Tool {

  render($$) {
    let Button = this.getComponent('button')
    let el = $$('div').addClass('sc-text-align-tool se-tool')

    let currentTextAlign = this.props.node.textAlign || 'left'

    TEXT_ALIGNMENTS.forEach((textAlign) => {
      let button = $$(Button, {
        icon: 'align-'+textAlign,
        active: currentTextAlign === textAlign,
        disabled: this.props.disabled,
        style: this.props.style
      }).attr('data-text-align', textAlign)
        .on('click', this.handleClick)
      el.append(button)
    })
    return el
  }

  handleClick(e) {
    let newTextAlign = e.currentTarget.dataset.textAlign
    e.preventDefault()
    this.context.commandManager.executeCommand(this.getCommandName(), {
      textAlign: newTextAlign
    })
  }
}

export default TextAlignTool
