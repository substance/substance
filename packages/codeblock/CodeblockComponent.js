import { TextBlockComponent } from '../../ui'

class CodeblockComponent extends TextBlockComponent {
  render($$) {
    let el = super.render.call(this, $$)
    return el.addClass('sc-codeblock')
  }
}

export default CodeblockComponent
