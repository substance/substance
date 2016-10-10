import isNumber from 'lodash/isNumber'
import Coordinate from '../model/Coordinate'
import AnnotatedTextComponent from './AnnotatedTextComponent'
import CursorComponent from './CursorComponent'
import SelectionFragmentComponent from './SelectionFragmentComponent'

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

  didMount() {
    super.didMount()

    this.context.flow.subscribe({
      stage: 'render',
      resources: [{
        source: this.getDocument(),
        path: this.props.path
      }],
      handler: this._onUpdate,
      owner: this
    })

    // TODO: instead of letting Surface manage TextProperties
    // we should instead use the Flow in future
    let surface = this.getSurface()
    if (surface) {
      surface._registerTextProperty(this)
    }
  }

  dispose() {
    super.dispose()

    this.context.flow.unsubscribe(this)

    let surface = this.getSurface()
    if (surface) {
      surface._unregisterTextProperty(this)
    }
  }

  render($$) {
    let path = this.getPath()

    let el = this._renderContent($$)
      .addClass('sc-text-property')
      .attr({
        'data-path': path.join('.'),
        spellCheck: false,
      })
      .css({
        'white-space': 'pre-wrap'
      })

    if (this.context.dragManager) {
      el.on('dragenter', this.onDragEnter)
        .on('dragover', this.onDragOver)
        .on('drop', this.onDrop)
    }

    if (!this.props.withoutBreak) {
      el.append($$('br'))
    }
    return el
  }

  _onUpdate(text) {
    this.rerender()
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
      if (node.constructor.isInline) {
        el.ref(id)
      }
      // Adding refs here, enables preservative rerendering
      // TODO: while this solves problems with rerendering inline nodes
      // with external content, it decreases the overall performance too much.
      // We should optimize the component first before we can enable this.
      else if (this.context.config && this.context.config.preservativeTextPropertyRendering) {
        el.ref(id + '@' + fragment.counter)
      }
    }
    el.attr('data-offset', fragment.pos)
    return el
  }

  onDragEnter(event) {
    event.preventDefault()
  }

  onDragOver(event) {
    event.preventDefault()
  }

  onDrop(event) {
    // console.log('Received drop on TextProperty', this.getPath());
    this.context.dragManager.onDrop(event, this)
  }

  getPath() {
    return this.props.path
  }

  getText() {
    return this.getDocument().get(this.getPath())
  }

  getAnnotations() {
    let path = this.getPath()
    let annotations = this.getDocument().getIndex('annotations').get(path)
    let fragments = this.props.fragments
    if (fragments) {
      annotations = annotations.concat(fragments)
    }
    return annotations
  }

  getDocument() {
    return this.props.doc ||this.context.doc
  }

  getController() {
    return this.props.controller || this.context.controller
  }

  getSurface() {
    return this.props.surface ||this.context.surface
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
