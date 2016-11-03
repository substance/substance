import isNumber from 'lodash/isNumber'
import Coordinate from '../model/Coordinate'
import AnnotatedTextComponent from './AnnotatedTextComponent'
import CursorComponent from './CursorComponent'
import SelectionFragmentComponent from './SelectionFragmentComponent'
import diff from '../util/diff'

/**
  Renders a text property. Used internally by different components to render
  editable text.

  @class
  @component
  @extends ui/AnnotatedTextComponent

  @prop {String[]} path path to a text property
  @prop {String} [tagName] specifies which tag should be used - defaults to `div`

  @example

  ```js
  $$(TextProperty, {
    path: [ 'paragraph-1', 'content']
  })
  ```
*/

class TextPropertyComponent extends AnnotatedTextComponent {

  getInitialState() {
    const markersManager = this.context.markersManager
    let path = this.props.path
    let markers
    if (markersManager) {
      // register and get initial set of markers
      markersManager.register(this)
      markers = markersManager.getMarkers(path, {
        surfaceId: this.getSurfaceId(),
        containerId: this.getContainerId()
      })
    } else {
      const doc = this.getDocument()
      markers = doc.getAnnotations(path)
    }
    return {
      markers: markers
    }
  }

  didMount() {
    if (this.context.surface.hasNativeSpellcheck()) {
      this.domObserver = new window.MutationObserver(this._onDomMutations.bind(this));
      this.domObserver.observe(this.el.getNativeElement(), { subtree: true, characterData: true, characterDataOldValue: true });
    }
  }

  dispose() {
    if (this.context.markersManager) {
      this.context.markersManager.deregister(this)
    }
  }

  render($$) {
    let path = this.getPath()

    let el = this._renderContent($$)
      .addClass('sc-text-property')
      .attr({
        'data-path': path.join('.')
      })
      .css({
        'white-space': 'pre-wrap'
      })

    if (!this.props.withoutBreak) {
      el.append($$('br'))
    }
    return el
  }

  getAnnotations() {
    return this.state.markers
  }

  _renderFragment($$, fragment) {
    let node = fragment.node
    let id = node.id
    let el
    if (node.type === 'cursor') {
      el = $$(CursorComponent, { collaborator: node.collaborator })
    } else if (node.type === 'selection-fragment') {
      el = $$(SelectionFragmentComponent, { collaborator: node.collaborator })
    } else {
      el = super._renderFragment.apply(this, arguments)
      el.ref(id + '@' + fragment.counter)
      // NOTE: before we only preserved inline nodes, or if configured explicitly
      // now the performance seems good enough to do this all the time.
      // if (node.constructor.isInline) {
      //   el.ref(id)
      // }
      // Adding refs here, enables preservative rerendering
      // TODO: while this solves problems with rerendering inline nodes
      // with external content, it decreases the overall performance too much.
      // We should optimize the component first before we can enable this.
      // else if (this.context.config && this.context.config.preservativeTextPropertyRendering) {
      //   el.ref(id + '@' + fragment.counter)
      // }
    }
    el.attr('data-offset', fragment.pos)
    return el
  }

  _onDomMutations(mutations) {
    // HACK: only detecting mutations that are coming from the native spell-correction
    if (mutations.length === 2 && mutations[0].target === mutations[1].target) {
      let textEl = mutations[0].target._wrapper
      if (textEl) {
        this._applyTextMutation(textEl, mutations[0].oldValue)
        return
      }
    }
    // in all other cases, revert the change by rerendering
    this.rerender()
  }

  _applyTextMutation(textEl, oldText) {
    // find the offset
    let offset = _getCharPos(textEl, 0)
    let newText = textEl.textContent
    let changes = diff(oldText, newText, offset)

    let editorSession = this.context.editorSession
    let path = this.getPath()
    editorSession.transaction(function(tx) {
      changes.forEach(function(change) {
        // NOTE: atomic text replace is not supported currently
        if (change.type === 'replace') {
          tx.update(path, { type: 'delete', start: change.start, end: change.end })
          tx.update(path, { type: 'insert', start: change.start, text: change.text })
        } else {
          tx.update(path, change)
        }
      })
    })
  }

  getPath() {
    return this.props.path
  }

  getRealPath() {
    return this.getDocument().getRealPath(this.props.path)
  }

  getText() {
    return this.getDocument().get(this.getPath())
  }

  getDocument() {
    return this.props.doc ||this.context.doc
  }

  getSurface() {
    return this.props.surface || this.context.surface
  }

  // used by MarkersManager to abstract away how this is implemented
  getSurfaceId() {
    let surface = this.getSurface()
    return surface ? surface.id : null
  }

  getContainerId() {
    let surface = this.getSurface()
    return surface ? surface.getContainerId() : null
  }

  isEditable() {
    return this.getSurface().isEditable()
  }

  isReadonly() {
    return this.getSurface().isReadonly()
  }

  getDOMCoordinate(charPos) {
    return this._getDOMCoordinate(this.el, charPos)
  }


  _finishFragment(fragment, context, parentContext) {
    context.attr('data-length', fragment.length)
    parentContext.append(context)
  }

  _getDOMCoordinate(el, charPos) {
    let l
    let idx = 0
    if (charPos === 0) {
      return {
        container: el.getNativeElement(),
        offset: 0
      }
    }
    for (let child = el.getFirstChild(); child; child = child.getNextSibling(), idx++) {
      if (child.isTextNode()) {
        l = child.textContent.length
        if (l >= charPos) {
          return {
            container: child.getNativeElement(),
            offset: charPos
          }
        } else {
          charPos -= l;
        }
      } else if (child.isElementNode()) {
        let length = child.getAttribute('data-length')
        if (length) {
          l = parseInt(length, 10)
          if (l >= charPos) {
            // special handling for InlineNodes
            if (child.attr('data-inline')) {
              let nextSibling = child.getNextSibling()
              if (nextSibling && nextSibling.isTextNode()) {
                return {
                  container: nextSibling.getNativeElement(),
                  offset: 0
                }
              } else {
                return {
                  container: el.getNativeElement(),
                  offset: el.getChildIndex(child) + 1
                }
              }
            }
            return this._getDOMCoordinate(child, charPos, idx)
          } else {
            charPos -= l
          }
        } else {
          console.error('FIXME: Can not map to DOM coordinates.')
          return null
        }
      }
    }
  }

}

TextPropertyComponent.prototype._isTextPropertyComponent = true


// Helpers for DOM selection mapping

TextPropertyComponent.getCoordinate = function(root, node, offset) {
  let context = _getPropertyContext(root, node, offset)
  if (!context) {
    return null
  }
  // in some cases we need to normalize the DOM coordinate
  // before we can use it for retrieving charPos
  // E.g. observed with #273
  node = context.node
  offset = context.offset
  var charPos = _getCharPos(context.node, context.offset)
  if (isNumber(charPos)) {
    return new Coordinate(context.path, charPos)
  }
  return null
}

function _getPropertyContext(root, node, offset) {
  let result = {
    el: null,
    path: null,
    node: node,
    offset: offset
  }
  while (node && node !== root) {
    if (node.isElementNode()) {
      let path = node.getAttribute('data-path')
      if (path) {
        result.el = node;
        result.path = path.split('.')
        return result;
      }
      if (node.getAttribute('data-inline')) {
        // we need to normalize situations where the DOM coordinate
        // is inside an inline node, which we have observed
        // can actually happen.
        result.node = node
        if (offset > 0) {
          result.offset = 1
        }
      }
    }
    node = node.getParent()
  }
  return null
}

function _getCharPos(node, offset) {
  let charPos = offset
  let parent, childIdx

  /*
    In the following implementation we are exploiting two facts
    for optimization:
    - an element with data-path is assumed to be the text property element
    - an element with data-offset is assumed to be an annotation element

    Particularly, the data-offset property is helpful to get the character position
    in just one iteration.
  */

  parent = node.getParent()
  if (node.isTextNode()) {
    // TextNode is first child
    if (node === parent.firstChild) {
      // ... we can stop if parent is text property
      let parentPath = parent.getAttribute('data-path')
      let parentOffset = parent.getAttribute('data-offset')
      if (parentPath) {
        charPos = offset
      }
      // ... and we can stop if parent has an offset hint
      else if (parentOffset) {
        charPos = parseInt(parentOffset, 10) + offset
      }
      // ... otherwise we count the charPos by recursing up-tree
      else {
        charPos = _getCharPos(parent, 0) + offset
      }
    } else {
      // the node has a predecessor so we can apply recurse using the child index
      childIdx = parent.getChildIndex(node)
      charPos = _getCharPos(parent, childIdx) + offset
    }
  } else if (node.isElementNode()) {
    let pathStr = node.getAttribute('data-path')
    let offsetStr = node.getAttribute('data-offset')
    // if node is the element of a text property, then offset is a child index
    // up to which we need to sum up all lengths
    if (pathStr) {
      charPos = _countCharacters(node, offset)
    }
    // similar if node is the element of an annotation, and we can use the
    // element's offset
    else if (offsetStr) {
      childIdx = parent.getChildIndex(node)
      charPos = parseInt(offsetStr, 10) + _countCharacters(node, offset)
    }
    // for other elements we need to count characters in the child tree
    // adding the offset of this element which needs to be computed by recursing up-tree
    else {
      childIdx = parent.getChildIndex(node)
      charPos = _getCharPos(parent, childIdx) + _countCharacters(node, offset)
    }
  } else {
    // Unsupported case
    return null
  }
  return charPos;
}

function _countCharacters(el, maxIdx) {
  let charPos = 0
  // inline elements have a length of 1
  if (el.getAttribute('data-inline')) {
    return maxIdx === 0 ? 0 : 1;
  }
  let l = el.getChildCount()
  if (arguments.length === 1) {
    maxIdx = l;
  }
  maxIdx = Math.min(l, maxIdx)
  for (let i=0, child = el.getFirstChild(); i < maxIdx; child = child.getNextSibling(), i++) {
    if (child.isTextNode()) {
      charPos += child.getTextContent().length
    } else if (child.isElementNode()) {
      let length = child.getAttribute('data-length')
      if (child.getAttribute('data-inline')) {
        charPos += 1
      } else if (length) {
        charPos += parseInt(length, 10)
      } else {
        charPos += _countCharacters(child)
      }
    }
  }
  return charPos
}

export default TextPropertyComponent
