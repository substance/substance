import { TextBlockComponent } from '../../ui'

class BlockquoteComponent extends TextBlockComponent {
  render($$) {
    let el = super.render.call(this, $$)
    return el.addClass('sc-blockquote')
  }
}

export default BlockquoteComponent
