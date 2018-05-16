import TextBlockComponent from '../../ui/TextBlockComponent'

class CodeblockComponent extends TextBlockComponent {
  render ($$) {
    let el = super.render.call(this, $$)
    return el.addClass('sc-codeblock')
  }
}

export default CodeblockComponent
