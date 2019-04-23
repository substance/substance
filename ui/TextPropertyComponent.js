import getKeyForPath from '../util/getKeyForPath'
import isNumber from '../util/isNumber'
import Coordinate from '../model/Coordinate'
import Component from './Component'
import AnnotatedTextComponent from './AnnotatedTextComponent'
import SelectionFragmentComponent from './SelectionFragmentComponent'

/**
 * Renders a text property. Used internally by different components to render
 * editable text.
 *
 * @example
 *
 * ```js
 * $$(TextProperty, {
 *   path: [ 'paragraph-1', 'content']
 * })
 * ```
 */
export default class TextPropertyComponent extends AnnotatedTextComponent {
  getInitialState () {
    const markersManager = this.context.markersManager
    let path = this.getPath()
    let markers
    if (markersManager) {
      // get initial set of markers
      markers = markersManager.getMarkers(path, {
        surfaceId: this.getSurfaceId(),
        containerPath: this.getContainerPath()
      })
    } else {
      const doc = this.getDocument()
      markers = doc.getAnnotations(path)
    }
    return { markers }
  }

  didMount () {
    const markersManager = this.context.markersManager
    if (markersManager) {
      markersManager.register(this)
    }
  }

  dispose () {
    const markersManager = this.context.markersManager
    if (markersManager) {
      markersManager.deregister(this)
    }
  }

  render ($$) {
    let path = this.getPath()

    let el = this._renderContent($$)
      .addClass('sc-text-property')
      .attr({
        'data-path': getKeyForPath(path)
      })
      .css({
        'white-space': 'pre-wrap'
      })

    if (this.isEmpty()) {
      el.addClass('sm-empty')
      if (this.props.placeholder) {
        el.setAttribute('data-placeholder', this.props.placeholder)
      }
    }

    if (!this.props.withoutBreak) {
      el.append($$('br'))
    }

    return el
  }

  getAnnotations () {
    if (this.props.markers) {
      return this.state.markers.concat(this.props.markers)
    } else {
      return this.state.markers
    }
  }

  _renderFragment ($$, fragment) {
    let node = fragment.node
    let id = node.id
    let el
    if (node.type === 'selection-fragment') {
      el = $$(SelectionFragmentComponent, { collaborator: node.collaborator })
    } else {
      el = super._renderFragment.apply(this, arguments)
      if (id) {
        el.ref(id + '@' + fragment.counter)
      }
    }
    el.attr('data-offset', fragment.pos)
    return el
  }

  getSurface () {
    return this.props.surface || this.context.surface
  }

  getSurfaceId () {
    let surface = this.getSurface()
    return surface ? surface.id : null
  }

  getContainerPath () {
    let surface = this.getSurface()
    return surface ? surface.getContainerPath() : null
  }

  isEditable () {
    const surface = this.getSurface()
    return surface ? surface.isEditable() : false
  }

  isReadonly () {
    const surface = this.getSurface()
    return surface ? surface.isReadonly() : true
  }

  getDOMCoordinate (charPos) {
    return this._getDOMCoordinate(this.el, charPos)
  }

  _finishFragment (fragment, context, parentContext) {
    context.attr('data-length', fragment.length)
    parentContext.append(context)
  }

  _getDOMCoordinate (el, charPos) {
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
          charPos -= l
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

  get _isTextPropertyComponent () { return true }

  // Helpers for DOM selection mapping

  /*
    Used to map from DOM to model.
    Given a root element and a DOM element - which is typically somewhere inside a surface
    it tries to find the next TextProperty by walking up the DOM.
    If found it computes the character position, counting chars and using the hints, data-length and data-offset,
    rendered by the TextPropertyComponent
  */
  static getCoordinate (root, el, offset) {
    let context = this._getPropertyContext(root, el, offset)
    if (!context) {
      return null
    }
    let textPropertyComp = context.comp
    // in some cases we need to normalize the DOM coordinate
    // before we can use it for retrieving charPos (e.g., observed in #273)
    let charPos = textPropertyComp._getCharPos(context.node, context.offset)
    if (isNumber(charPos)) {
      let coor = new Coordinate(context.path, charPos)
      // TODO: what is this used for?
      coor._comp = textPropertyComp
      return coor
    } else {
      return null
    }
  }

  static _getPropertyContext (root, node, offset) {
    let result = {
      comp: null,
      el: null,
      path: null,
      node: node,
      offset: offset
    }
    while (node && node !== root) {
      if (node.isElementNode()) {
        let comp = Component.unwrap(node)
        if (comp && comp._isTextPropertyComponent) {
          result.comp = comp
          result.el = node
          result.path = comp.getPath()
          return result
        }
        // we need to normalize situations where the DOM coordinate
        // is inside an inline node, which we have observed
        // can actually happen.
        if (node.getAttribute('data-inline')) {
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

  _getCharPos (node, offset) {
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
        // ... and we can stop if parent has an offset hint
        } else if (parentOffset) {
          charPos = parseInt(parentOffset, 10) + offset
        // ... otherwise we count the charPos by recursing up-tree
        } else {
          charPos = this._getCharPos(parent, 0) + offset
        }
      } else {
        // the node has a predecessor so we can apply recurse using the child index
        childIdx = parent.getChildIndex(node)
        charPos = this._getCharPos(parent, childIdx) + offset
      }
    } else if (node.isElementNode()) {
      let pathStr = node.getAttribute('data-path')
      let offsetStr = node.getAttribute('data-offset')
      // if node is the element of a text property, then offset is a child index
      // up to which we need to sum up all lengths
      if (pathStr) {
        charPos = this._countCharacters(node, offset)
      // similar if node is the element of an annotation, and we can use the
      // element's offset
      } else if (offsetStr) {
        childIdx = parent.getChildIndex(node)
        charPos = parseInt(offsetStr, 10) + this._countCharacters(node, offset)
      // for other elements we need to count characters in the child tree
      // adding the offset of this element which needs to be computed by recursing up-tree
      } else {
        childIdx = parent.getChildIndex(node)
        charPos = this._getCharPos(parent, childIdx) + this._countCharacters(node, offset)
      }
    } else {
      // Unsupported case
      return null
    }
    return charPos
  }

  _countCharacters (el, maxIdx) {
    let charPos = 0
    // inline elements have a length of 1
    if (el.getAttribute('data-inline')) {
      return maxIdx === 0 ? 0 : 1
    }
    let l = el.getChildCount()
    if (arguments.length === 1) {
      maxIdx = l
    }
    maxIdx = Math.min(l, maxIdx)
    for (let i = 0, child = el.getFirstChild(); i < maxIdx; child = child.getNextSibling(), i++) {
      if (child.isTextNode()) {
        charPos += child.getTextContent().length
      } else if (child.isElementNode()) {
        let length = child.getAttribute('data-length')
        if (child.getAttribute('data-inline')) {
          charPos += 1
        } else if (length) {
          charPos += parseInt(length, 10)
        } else {
          charPos += this._countCharacters(child)
        }
      }
    }
    return charPos
  }
}
