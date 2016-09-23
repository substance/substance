import TextBlockComponent from '../../ui/TextBlockComponent'

class ParagraphComponent extends TextBlockComponent {
  render($$) {
    let el = super.render.call(this, $$)
    return el.addClass('sc-paragraph')
  }
}

export default ParagraphComponent
