import TextBlockComponent from '../../ui/TextBlockComponent'

class BlockquoteComponent extends TextBlockComponent {
  render($$) {
    let el = super.render.call(this, $$)
    return el.addClass('sc-blockquote')
  }
}

export default BlockquoteComponent
