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
      el.setAttribute('contenteditable', true)
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

  /**
    Selects all text
  */
  selectAll() {
    let doc = this.getDocument()
    let path = this.props.path
    let text = doc.get(path)
    let sel = doc.createSelection({
      type: 'property',
      path: path,
      startOffset: 0,
      endOffset: text.length
    })
    this.setSelection(sel)
  }

}

export default TextPropertyEditor
