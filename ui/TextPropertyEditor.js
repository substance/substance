import Surface from '../packages/surface/Surface'
import TextProperty from './TextPropertyComponent'

/**
  Editor for a text property (annotated string). Needs to be
  instantiated inside a {@link ui/Controller} context.

  @class
  @component
  @extends ui/Surface

  @prop {String} name unique editor name
  @prop {String[]} path path to a text property
  @prop {ui/SurfaceCommand[]} commands array of command classes to be available

  @example

  Create a `TextPropertyEditor` for the `name` property of an author object. Allow emphasis annotations.

  ```js
  $$(TextPropertyEditor, {
    name: 'authorNameEditor',
    path: ['author_1', 'name'],
    commands: [EmphasisCommand]
  })
  ```
*/

class TextPropertyEditor extends Surface {

  constructor(parent, props) {
    // making props.name optional
    props.name = props.name || props.path.join('.')
    super(parent, props)

    if (!props.path) {
      throw new Error("Property 'path' is mandatory.")
    }
  }

  render($$) {
    let el = super.render.apply(this, arguments)
    el.addClass("sc-text-property-editor")

    if (!this.props.disabled) {
      el.addClass('sm-enabled')
      el.attr('contenteditable', true)
      // native spellcheck
      el.attr('spellcheck', this.props.spellcheck === 'native')
    }

    el.append(
      $$(TextProperty, {
        tagName: this.props.tagName || "div",
        path: this.props.path,
        withoutBreak: this.props.withoutBreak
      })
    )

    return el
  }

  _handleEnterKey(event) {
    event.preventDefault()
    event.stopPropagation()
    if (this.props.multiLine) {
      super._handleEnterKey(event)
    }
  }

  getPath() {
    return this.props.path
  }
}

TextPropertyEditor.prototype._isTextPropertyEditor = true

export default TextPropertyEditor
