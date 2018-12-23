import NodeComponent from './NodeComponent'
import TextProperty from './TextPropertyComponent'

export default class TextBlockComponent extends NodeComponent {
  render ($$) {
    let el = super.render($$)
    el.addClass('sc-text-block')

    let model = this.props.model
    // NOTE: we are not using the native text direction support as it changes the contenteditable behavior in a weird way
    // instead rtl text is supported on model level
    if (model.direction) {
      // el.attr('data-direction', model.direction)
      el.attr('dir', model.direction)
    }
    if (model.textAlign) {
      el.addClass('sm-align-' + model.textAlign)
    }
    el.append($$(TextProperty, {
      placeholder: this.props.placeholder,
      path: model.getPath(),
      direction: model.direction
    }))
    return el
  }
}
