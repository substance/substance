import isArrayEqual from '../util/isArrayEqual'
import Annotation from './Annotation'

/**
  A property annotation can be used to overlay text and give it a special meaning.
  PropertyAnnotations only work on text properties. If you want to annotate multiple
  nodes you have to use a {@link model/ContainerAnnotation}.

  @prop {String[]} path Identifies a text property in the document (e.g. `['text_1', 'content']`)
  @prop {Number} startOffset the character where the annoation starts
  @prop {Number} endOffset: the character where the annoation starts

  @example

  Here's how a **strong** annotation is created. In Substance annotations are stored
  separately from the text. Annotations are just regular nodes in the document.
  They refer to a certain range (`startOffset, endOffset`) in a text property (`path`).

  ```js
  doc.transaction(function(tx) {
    tx.create({
      id: 's1',
      type: 'strong',
      start: {
        path: ['p1', 'content'],
        offset: 10
      },
      end: {
        offset
      }
      path: ['p1', 'content'],
      "startOffset": 10,
      "endOffset": 19
    })
  })
  ```
*/
class PropertyAnnotation extends Annotation {

  get path() {
    return this.start.path
  }

  getPath() {
    return this.start.path
  }

  getSelection() {
    return this.getDocument().createSelection({
      type: 'property',
      path: this.path,
      startOffset: this.start.offset,
      endOffset: this.end.offset
    })
  }

  // used by annotationHelpers
  _updateRange(tx, sel) {
    if (!sel.isPropertySelection()) {
      throw new Error('Invalid argument: PropertyAnnotation._updateRange() requires a PropertySelection.')
    }
    if (!isArrayEqual(this.start.path, sel.start.path)) {
      tx.set([this.id, 'path'], sel.start.path)
    }
    // TODO: these should be Coordinate ops
    if (this.start.offset !== sel.start.offset) {
      tx.set([this.id, 'start', 'offset'], sel.start.offset)
    }
    if (this.end.offset !== sel.end.offset) {
      tx.set([this.id, 'end', 'offset'], sel.end.offset)
    }
  }

  get startPath() {
    return this.path
  }

  get endPath() {
    return this.path
  }
}

PropertyAnnotation.isPropertyAnnotation = true
PropertyAnnotation.prototype._isAnnotation = true
PropertyAnnotation.prototype._isPropertyAnnotation = true

PropertyAnnotation.schema = {
  type: "annotation",
  start: "coordinate",
  end: "coordinate",
  // this is only used when an annotation is used 'stand-alone'
  // i.e. not attached to a property
  _content: { type: "string", optional: true}
}

export default PropertyAnnotation
