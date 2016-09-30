import { module } from 'substance-test'
/* eslint-disable no-invalid-this, indent */

import get from 'lodash/get'
import isArray from 'lodash/isArray'
import DOMSelection from '../../ui/DOMSelection'
import TextPropertyComponent from '../../ui/TextPropertyComponent'
import Document from '../../model/Document'
import Container from '../../model/Container'
import Paragraph from '../../packages/paragraph/Paragraph'
import ContainerSelection from '../../model/ContainerSelection'
import PropertySelection from '../../model/PropertySelection'
import setDOMSelection from '../../util/setDOMSelection'

const test = module('ui/DOMSelection')

class StubDoc {
  constructor(el) {
    this.el = el
    this.nodes = null
  }

  get(path) {
    if (this.nodes === null) {
      this.nodes = {}
      this.nodes['body'] = new Container(this, {
        type: 'container',
        id: 'body',
        nodes: []
      })
      var propEls = this.el.findAll('*[data-path]')
      for (var i = 0; i < propEls.length; i++) {
        var propEl = propEls[i]
        var nodeId = propEl.getAttribute('data-path').split('.')[0]
        this.nodes[nodeId] = new Paragraph(this, {
          type: 'paragraph',
          id: nodeId,
          content: propEl.textContent
        })
        this.nodes['body'].nodes.push(nodeId)
      }
    }

    if (!isArray(path)) {
      path = [path]
    }
    var result = get(this.nodes, path)
    return result
  }

  on() {}
  off() {}
}

StubDoc.prototype.createSelection = Document.prototype.createSelection


class StubSurface {
  constructor(el, containerId) {
    this.el = el
    this.doc = new StubDoc(el)
    this.containerId = containerId
  }

  getDocument() {
    return this.doc
  }

  isContainerEditor() {
    return Boolean(this.containerId)
  }

  getContainerId() {
    return this.containerId
  }

  getNativeElement() {
    return this.el.getNativeElement()
  }

  _getTextPropertyComponent(path) {
    var pathStr = path
    if (isArray(path)) {
      pathStr = path.join('.')
    }
    var el = this.el.find('*[data-path="'+pathStr+'"]')
    if (!el) {
      return null
    }
    return new StubTextPropertyComponent(el)
  }
}


function StubTextPropertyComponent(el) {
  this.el = el

  this.getDOMCoordinate = TextPropertyComponent.prototype.getDOMCoordinate

  this._getDOMCoordinate = TextPropertyComponent.prototype._getDOMCoordinate
}

// Fixtures
var singlePropertyFixture = [
  '<div id="test1">',
    '<span data-path="test1.content">Hello World!</span>',
  '</div>'
].join('')

var mixedFixture = [
  '<div id="before">Before</div>',
  '<div id="test1">',
    '<span data-path="test1.content">The first property.</span>',
  '</div>',
  '<div id="test2">',
    '<span data-path="test2.content">The second property.</span>',
  '</div>',
  '<div id="between">Between</div>',
  '<div id="test3">',
    '<span data-path="test3.content">The third property.</span>',
  '</div>',
  '<div id="test4">',
    '<span data-path="test4.content">The forth property.</span>',
  '</div>',
  '<div id="after">After</div>'
].join('')

test.UI("Get coordinate for collapsed selection", function(t) {
  var el = t.sandbox.html(singlePropertyFixture)
  var domSelection = new DOMSelection(new StubSurface(el))
  var node = el.find('#test1 > span').getFirstChild()
  var offset = 5
  var coor = domSelection._getCoordinate(node, offset)
  t.ok(coor, "Extracted coordinate should be !== null")
  t.deepEqual(coor.path, ['test1', 'content'], 'Path should be extracted correctly.')
  t.equal(coor.offset, 5, 'Offset should be extracted correctly.')
  t.end()
})

test.UI("Search coordinate (before)", function(t) {
  var el = t.sandbox.html(mixedFixture)
  var domSelection = new DOMSelection(new StubSurface(el))
  var node = el.find('#before').getFirstChild()
  var offset = 1
  var coor = domSelection._searchForCoordinate(node, offset, {})
  t.ok(coor, "Extracted coordinate should be !== null")
  t.deepEqual(coor.path, ['test1', 'content'], 'Path should be extracted correctly.')
  t.equal(coor.offset, 0, 'Offset should be extracted correctly.')
  t.end()
})

test.UI("Search coordinate (between)", function(t) {
  var el = t.sandbox.html(mixedFixture)
  var domSelection = new DOMSelection(new StubSurface(el))
  var node = el.find('#between').getFirstChild()
  var offset = 1
  var coor = domSelection._searchForCoordinate(node, offset, {})
  t.ok(coor, "Extracted coordinate should be !== null")
  t.deepEqual(coor.path, ['test3', 'content'], 'Path should be extracted correctly.')
  t.equal(coor.offset, 0, 'Offset should be extracted correctly.')
  t.end()
})

test.UI("Search coordinate (between, left)", function(t) {
  var el = t.sandbox.html(mixedFixture)
  var domSelection = new DOMSelection(new StubSurface(el))
  var node = el.find('#between').getFirstChild()
  var offset = 1
  var coor = domSelection._searchForCoordinate(node, offset, {direction: 'left'})
  t.ok(coor, "Extracted coordinate should be !== null")
  t.deepEqual(coor.path, ['test2', 'content'], 'Path should be extracted correctly.')
  t.equal(coor.offset, 20, 'Offset should be extracted correctly.')
  t.end()
})

test.UI("Search coordinate (after)", function(t) {
  var el = t.sandbox.html(mixedFixture)
  var domSelection = new DOMSelection(new StubSurface(el))
  var node = el.find('#after').getFirstChild()
  var offset = 1
  var coor = domSelection._searchForCoordinate(node, offset, {direction: 'left'})
  t.ok(coor, "Extracted coordinate should be !== null")
  t.deepEqual(coor.path, ['test4', 'content'], 'Path should be extracted correctly.')
  t.equal(coor.offset, 19, 'Offset should be extracted correctly.')
  t.end()
})

test.UI("coordinate via search", function(t) {
  var el = t.sandbox.html(mixedFixture)
  var domSelection = new DOMSelection(new StubSurface(el))
  var node = el.find('#between').getFirstChild()
  var offset = 1
  var coor = domSelection._searchForCoordinate(node, offset)
  t.ok(coor, "Extracted coordinate should be !== null")
  t.deepEqual(coor.path, ['test3', 'content'], 'Path should be extracted correctly.')
  t.equal(coor.offset, 0, 'Offset should be extracted correctly.')
  t.end()
})

var emptyParagraphFixture = [
  '<div id="test1" class="content-node" data-id="test1">',
    '<span data-path="test1.content"></span>',
  '</div>'
].join('')

test.UI("DOM coordinate in empty paragraph", function(t) {
  var el = t.sandbox.html(emptyParagraphFixture)
  var domSelection = new DOMSelection(new StubSurface(el))
  var node = el.find('#test1')
  var offset = 0
  var coor = domSelection._getCoordinate(node, offset)
  t.notNil(coor, "Extracted coordinate should be mapped.")
  t.deepEqual(coor.path, ['test1', 'content'], 'Path should be extracted correctly.')
  t.equal(coor.offset, 0, 'Offset should be extracted correctly.')
  t.end()
})

var textWithAnnotations = [
  '<div id="test1">',
    '<span id="test1_content" data-path="test1.content">',
      '<span data-offset="0" data-length="2">..</span>',
      '<span data-offset="2" data-length="2">..</span>',
      '<span data-offset="4" data-length="2">..</span>',
      '<span data-offset="6" data-length="2">..</span>',
    '</span>',
  '</div>'
].join('')

test.UI("DOM coordinate on text property level (first)", function(t) {
  var el = t.sandbox.html(textWithAnnotations)
  var domSelection = new DOMSelection(new StubSurface(el))
  var node = el.find('#test1_content')
  var offset = 0
  var coor = domSelection._getCoordinate(node, offset)
  t.ok(coor, "Extracted coordinate should be !== null")
  t.deepEqual(coor.path, ['test1', 'content'], 'Path should be extracted correctly.')
  t.equal(coor.offset, 0, 'Offset should be extracted correctly.')
  t.end()
})

test.UI("DOM coordinate on text property level (last)", function(t) {
  var el = t.sandbox.html(textWithAnnotations)
  var domSelection = new DOMSelection(new StubSurface(el))
  var node = el.find('#test1_content')
  var offset = 4
  var coor = domSelection._getCoordinate(node, offset)
  t.ok(coor, "Extracted coordinate should be !== null")
  t.deepEqual(coor.path, ['test1', 'content'], 'Path should be extracted correctly.')
  t.equal(coor.offset, 8, 'Offset should be extracted correctly.')
  t.end()
})

var withAnnosAndInlines = [
  '<div id="test1">',
    '<span id="test1_content" data-path="test1.content">',
      '<span data-offset="0" data-length="2">..</span>',
      '<span data-inline="1" data-length="1" contenteditable="false">$</span>',
      '<span data-offset="3" data-length="2">..</span>',
      '<span data-inline="1" data-length="1" contenteditable="false">$</span>',
      '<span id="before-last" data-offset="6" data-length="2">..</span>',
      '<span data-inline="1" data-length="1" contenteditable="false">$</span>',
    '</span>',
  '</div>'
].join('')

test.UI("DOM coordinate after last inline", function(t) {
  var el = t.sandbox.html(withAnnosAndInlines)
  var domSelection = new DOMSelection(new StubSurface(el))
  var node = el.find('#test1_content')
  var offset = 6
  var coor = domSelection._getCoordinate(node, offset)
  t.ok(coor, "Extracted coordinate should be !== null")
  t.deepEqual(coor.path, ['test1', 'content'], 'Path should be extracted correctly.')
  t.equal(coor.offset, 9, 'Offset should be extracted correctly.')
  t.end()
})

test.UI("DOM selection spanning over inline at end", function(t) {
  var el = t.sandbox.html(withAnnosAndInlines)
  var domSelection = new DOMSelection(new StubSurface(el))
  var anchorNode = el.find('#before-last').getFirstChild()
  var anchorOffset = 2
  var focusNode = el.find('#test1_content')
  var focusOffset = 6
  var range = domSelection._getRange(anchorNode, anchorOffset, focusNode, focusOffset)
  t.ok(range, "Range should be !== null")
  t.notOk(range.reverse, "Selection should be forward")
  t.deepEqual(range.start.path, ['test1', 'content'], 'Path should be extracted correctly.')
  t.deepEqual(range.start.offset, 8, 'startOffset should be extracted correctly.')
  t.deepEqual(range.end.offset, 9, 'startOffset should be extracted correctly.')
  t.end()
})

var withoutHints = [
  '<div id="test1">',
    '<span id="test1_content" data-path="test1.content">',
      '<span>..</span>',
      '<span>..</span>',
      '<span>..</span>',
      '<span>..</span>',
    '</span>',
  '</div>'
].join('')

test.UI("Without hints: DOM coordinate in first text node", function(t) {
  var el = t.sandbox.html(withoutHints)
  var domSelection = new DOMSelection(new StubSurface(el))
  var node = el.find('#test1_content').getFirstChild().getFirstChild()
  var offset = 1
  var coor = domSelection._getCoordinate(node, offset)
  t.ok(coor, "Extracted coordinate should be !== null")
  t.equal(coor.offset, 1, 'Offset should be extracted correctly.')
  t.end()
})

test.UI("Without hints: DOM coordinate in second text node", function(t) {
  var el = t.sandbox.html(withoutHints)
  var domSelection = new DOMSelection(new StubSurface(el))
  var node = el.find('#test1_content').getChildAt(1).getFirstChild()
  var offset = 1
  var coor = domSelection._getCoordinate(node, offset)
  t.ok(coor, "Extracted coordinate should be !== null")
  t.equal(coor.offset, 3, 'Offset should be extracted correctly.')
  t.end()
})

test.UI("Without hints: DOM coordinate between spans", function(t) {
  var el = t.sandbox.html(withoutHints)
  var domSelection = new DOMSelection(new StubSurface(el))
  var node = el.find('#test1_content')
  var offset = 2
  var coor = domSelection._getCoordinate(node, offset)
  t.ok(coor, "Extracted coordinate should be !== null")
  t.equal(coor.offset, 4, 'Offset should be extracted correctly.')
  t.end()
})

// Test for issue #273

var issue273 = [
  '<span data-path="prop.content">',
    'XXX',
    '<span id="test" data-id="test" data-inline="1" data-length="1" contenteditable="false">',
      '[5]',
    '</span>',
    'XXX',
  '</span>'
].join('')

test.UI("Issue #273: 'Could not find char position' when clicking right above an inline node", function(t) {
  var el = t.sandbox.html(issue273)
  var domSelection = new DOMSelection(new StubSurface(el))
  var node = el.find('#test').getFirstChild()
  var offset = 0
  var coor = domSelection._getCoordinate(node, offset)
  t.ok(coor, "Extracted coordinate should be !== null")
  t.equal(coor.offset, 3, 'Offset should be extracted correctly.')
  offset = 2
  coor = domSelection._getCoordinate(node, offset)
  t.ok(coor, "Extracted coordinate should be !== null")
  t.equal(coor.offset, 4, 'Offset should be extracted correctly.')
  t.end()
})

var surfaceWithParagraphs = [
  '<div id="surface" class="sc-surface">',
    '<p id="p1">',
      '<span data-path="p1.content">AA</span>',
    '</p>',
    '<p id="p2">',
      '<span data-path="p2.content">BBB</span>',
    '</p>',
    '<p id="p3">',
      '<span data-path="p3.content">CCCC</span>',
    '</p>',
  '</div>'
].join('')

test.FF("Issue #354: Wrong selection in FF when double clicking between lines", function(t) {
  var el = t.sandbox.html(surfaceWithParagraphs)
  var domSelection = new DOMSelection(new StubSurface(el))
  var surface = el.find('#surface')
  setDOMSelection(surface, 0, surface, 1)
  var range = domSelection.mapDOMSelection()
  // t.ok(sel.isPropertySelection(), "Selection should be property selection.")
  t.deepEqual(range.start.path, ['p1', 'content'], 'Path should be extracted correctly.')
  t.deepEqual([range.start.offset, range.end.offset], [0, 2], 'Offsets should be extracted correctly.')
  t.end()
})

test.UI("Issue #376: Wrong selection mapping at end of paragraph", function(t) {
  var el = t.sandbox.html(surfaceWithParagraphs)
  var domSelection = new DOMSelection(new StubSurface(el))
  var p1span = el.find('#p1 span')
  var p2 = el.find('#p2')
  var range = domSelection._getRange(p1span, 1, p2, 0)
  t.deepEqual(range.start.path, ['p1', 'content'], 'startPath')
  t.deepEqual(range.start.offset, 2, 'startOffset')
  t.deepEqual(range.end.path, ['p2', 'content'], 'endPath')
  t.deepEqual(range.end.offset, 0, 'endOffset')
  t.end()
})

test.WK("Mapping a ContainerSelection to the DOM", function(t) {
  var el = t.sandbox.attr('contenteditable', true)
    .html(surfaceWithParagraphs)
  var domSelection = new DOMSelection(new StubSurface(el))
  var sel = new ContainerSelection('body', ['p1', 'content'], 1, ['p2', 'content'], 1)
  var p1Text = el.find('#p1 span').getFirstChild()
  var p2Text = el.find('#p2 span').getFirstChild()
  domSelection.setSelection(sel)
  var wSel = window.getSelection()
  t.equal(wSel.anchorNode, p1Text.getNativeElement(), 'anchorNode should be in first paragraph.')
  t.equal(wSel.anchorOffset, 1, 'anchorOffset should be correct.')
  t.equal(wSel.focusNode, p2Text.getNativeElement(), 'focusNode should be in second paragraph.')
  t.equal(wSel.focusOffset, 1, 'focusOffset should be correct.')
  t.end()
})

test.UI("Mapping a ContainerSelection from DOM to model", function(t) {
  var el = t.sandbox.html(surfaceWithParagraphs)
  var domSelection = new DOMSelection(new StubSurface(el, 'body'))
  var p1Text = el.find('#p1 span').getFirstChild()
  var p2Text = el.find('#p2 span').getFirstChild()
  setDOMSelection(p1Text, 1, p2Text, 2)
  var sel = domSelection.getSelection()
  t.ok(sel.isContainerSelection(), 'Should be a container selection.')
  t.deepEqual(sel.startPath, ['p1', 'content'], 'startPath should be correct.')
  t.equal(sel.startOffset, 1, 'startOffset should be correct.')
  t.deepEqual(sel.endPath, ['p2', 'content'], 'endPath should be correct.')
  t.equal(sel.endOffset, 2, 'endOffset should be correct.')
  t.end()
})

// TODO: is this a real case?
// This works in Chrome but not in FF
// Chrome maps the anchor to a textNode (text, 0) which is working fine
// FF takes the anchor as we specified it (surface, 2)
test.UI("DOM Coordinate on surface element", function(t) {
  var el = t.sandbox.html(surfaceWithParagraphs)
  var domSelection = new DOMSelection(new StubSurface(el, 'body'))
  var surface = el.find('#surface')
  setDOMSelection(surface, 2, surface, 2)
  var sel = domSelection.getSelection()
  t.ok(sel.isCollapsed, 'Selection should be collapsed.')
  t.deepEqual(sel.startPath, ['p3', 'content'], 'startPath should be correct.')
  t.equal(sel.startOffset, 0, 'startOffset should be correct.')
  t.end()
})

var textWithInlines = [
  '<div id="test1">',
    '<span id="test1-content" data-path="test1.content">',
      '123',
      '<span data-inline="1" data-length="1" contenteditable="false">$</span>',
      '45',
      '<span data-inline="1" data-length="1" contenteditable="false">$</span>',
    '</span>',
  '</div>'
].join('')

test.UI("Setting cursor after inline node", function(t) {
  var el = t.sandbox.attr('contenteditable', true)
    .html(textWithInlines)
  var domSelection = new DOMSelection(new StubSurface(el))
  var sel = new PropertySelection(['test1', 'content'], 4, 4)
  var content = el.find('#test1-content')
  var third = content.getChildAt(2)
  domSelection.setSelection(sel)
  var wSel = window.getSelection()
  t.equal(wSel.anchorNode, third.getNativeElement(), 'anchorNode should be after inline node.')
  t.equal(wSel.anchorOffset, 0, 'anchorOffset should be correct.')
  t.ok(wSel.focusNode === wSel.anchorNode, 'focusNode should be the same.')
  t.equal(wSel.focusOffset, 0, 'focusOffset should be correct.')
  t.end()
})

test.UI("Setting cursor after inline node at end of property", function(t) {
  var el = t.sandbox.attr('contenteditable', true)
    .html(textWithInlines)
  var domSelection = new DOMSelection(new StubSurface(el))
  var sel = new PropertySelection(['test1', 'content'], 7, 7)
  var content = el.find('#test1-content')
  domSelection.setSelection(sel)
  var wSel = window.getSelection()
  t.equal(wSel.anchorNode, content.getNativeElement(), 'anchorNode should be after inline node.')
  t.equal(wSel.anchorOffset, 4, 'anchorOffset should be correct.')
  t.ok(wSel.focusNode === wSel.anchorNode, 'focusNode should be the same.')
  t.equal(wSel.focusOffset, wSel.anchorOffset, 'focusOffset should be correct.')
  t.end()
})
