import { setText } from './documentHelpers'

export default function (SuperClass) {
  class TextNodeMixin extends SuperClass {
    getTextPath () {
      // TODO: deprecate this
      console.warn('DEPRECATED: use node.getPath()')
      return this.getPath()
    }

    getText () {
      return this.content
    }

    setText (text) {
      setText(this.getDocument(), this.getPath(), text)
      return this
    }

    isEmpty () {
      return !this.getText()
    }

    getLength () {
      return this.getText().length
    }

    getAnnotations () {
      return this.getDocument().getIndex('annotations').get(this.getPath())
    }
  }
  return TextNodeMixin
}
