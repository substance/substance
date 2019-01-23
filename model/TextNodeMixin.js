import { deleteTextRange } from './documentHelpers'

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
      const doc = this.getDocument()
      const path = this.getPath()
      const oldText = this.getText()
      if (oldText.length > 0) {
        deleteTextRange(doc, { path, offset: 0 })
        doc.update(path, { type: 'insert', start: 0, text })
      }
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
