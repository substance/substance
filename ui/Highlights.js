import EventEmitter from '../util/EventEmitter'
import forEach from '../util/forEach'
import without from '../util/without'

/*
  Manages highlights. Used by {@link ui/ScrollPane}.

  @class

  @param {model/Document} doc document instance

  @example

  ```
  var contentHighlights = new Highlights(doc);
  ```
*/

class Highlights extends EventEmitter {
  constructor(doc) {
    super()

    this.doc = doc
    this._highlights = {}
  }

  /**
    Get currently active highlights.

    @return {Object} Returns current highlights as a scoped object.
  */
  get() {
    return this._highlights
  }

  /**
    Set highlights.

    @param {Object} scoped object describing highlights

    @example

    ```js
      highlights.set({
        'figures': ['figure-1', 'figure-3']
        'citations': ['citation-1', 'citation-5']
      });
    ```
  */
  set(highlights) {
    let oldHighlights = this._highlights
    let doc = this.doc
    // Iterate over scopes of provided highlights
    forEach(highlights, function(newScopedHighlights, scope) {
      let oldScopedHighlights = oldHighlights[scope] || []

      // old [1,2,3]  -> new [2,4,5]
      // toBeDeleted: [1,3]
      // toBeAdded:   [4,5]
      let toBeDeleted = without(oldScopedHighlights, newScopedHighlights)
      let toBeAdded = without(newScopedHighlights, oldScopedHighlights)

      // if (scopedHighlights) {
      forEach(toBeDeleted, function(nodeId) {
        let node = doc.get(nodeId)
        // Node could have been deleted in the meanwhile
        if (node) {
          node.setHighlighted(false, scope)
        }
      });

      forEach(toBeAdded, function(nodeId) {
        let node = doc.get(nodeId)
        if (node) {
          node.setHighlighted(true, scope)
        }
      })
    })

    this._highlights = highlights

    /**
      Emitted when highlights have been updated

      @event ui/Highlights@highlights:updated
    */
    this.emit('highlights:updated', highlights)
  }
}

export default Highlights
