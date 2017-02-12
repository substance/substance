import forEach from '../util/forEach'
import isString from '../util/isString'

const ENTER = 1
const EXIT = -1
const ANCHOR = -2

// Fragmenter
// --------
//
// An algorithm that is used to fragment overlapping structure elements
// following a priority rule set.
// E.g., we use this for creating DOM elements for annotations. The annotations
// can partially be overlapping. However this is not allowed in general for DOM elements
// or other hierarchical structures.
//
// Example: For the annotation use case consider a 'comment' spanning partially
// over an 'emphasis' annotation.
// 'The <comment>quick brown <bold>fox</comment> jumps over</bold> the lazy dog.'
// We want to be able to create a valid XML structure:
// 'The <comment>quick brown <bold>fox</bold></comment><bold> jumps over</bold> the lazy dog.'
//
// For that one would choose
//
//     {
//        'comment': 0,
//        'bold': 1
//     }
//
// as priority levels.
// In case of structural violations as in the example, elements with a higher level
// would be fragmented and those with lower levels would be preserved as one piece.
//
// TODO: If a violation for nodes of the same level occurs an Error should be thrown.
// Currently, in such cases the first element that is opened earlier is preserved.

class Fragmenter {

  constructor(options) {
    Object.assign(this, options)
  }

  start(rootContext, text, annotations) {
    if (!isString(text)) {
      throw new Error("Illegal argument: 'text' must be a String, but was " + text)
    }
    this._start(rootContext, text, annotations)
  }

  onText(context, text, entry) { // eslint-disable-line
  }

  // should return the created user context
  onEnter(entry, parentContext) { // eslint-disable-line
    return null
  }

  onExit(entry, context, parentContext) { // eslint-disable-line
  }

  _enter(entry, parentContext) {
    entry.counter++
    return this.onEnter(entry, parentContext)
  }

  _exit(entry, context, parentContext) {
    this.onExit(entry, context, parentContext)
  }

  _createText(context, text, entry) {
    this.onText(context, text, entry)
  }

  _start(rootContext, text, annotations) {
    var entries = _extractEntries.call(this, annotations)
    var stack = [{context: rootContext, entry: null}]

    var pos = 0
    for (var i = 0; i < entries.length; i++) {
      var entry = entries[i]
      var textFragment = text.substring(pos, entry.pos)
      if (textFragment) {
        // add the last text to the current element
        this._createText(stack[stack.length-1].context, textFragment, entry)
      }

      pos = entry.pos
      var stackLevel, idx, _entry
      if (entry.mode === ENTER || entry.mode === ANCHOR) {
        // find the correct position and insert an entry
        for (stackLevel = 1; stackLevel < stack.length; stackLevel++) {
          if (entry.level < stack[stackLevel].entry.level) {
            break
          }
        }
        // create elements which are open, and are now stacked ontop of the
        // entered entry
        for (idx = stack.length-1; idx >= stackLevel; idx--) {
          _entry = stack[idx].entry
          // compute number of characters since last 'enter'
          _entry.length = pos - _entry.pos
          this._exit(_entry, stack[idx].context, stack[idx-1].context)
        }
        stack.splice(stackLevel, 0, {entry: entry})
        // create new elements for all lower entries
        for (idx = stackLevel; idx < stack.length; idx++) {
          _entry = stack[idx].entry
          // bump 'enter' pos
          _entry.pos = pos
          stack[idx].context = this._enter(_entry, stack[idx-1].context)
        }
      }
      if (entry.mode === EXIT || entry.mode === ANCHOR) {
        // find the according entry and remove it from the stack
        for (stackLevel = 1; stackLevel < stack.length; stackLevel++) {
          if (stack[stackLevel].entry.node === entry.node) {
            break
          }
        }
        for (idx = stack.length-1; idx >= stackLevel; idx--) {
          _entry = stack[idx].entry
          // compute number of characters since last 'enter'
          _entry.length = pos - _entry.pos
          this._exit(_entry, stack[idx].context, stack[idx-1].context)
        }
        stack.splice(stackLevel, 1)
        // create new elements for all lower entries
        for (idx = stackLevel; idx < stack.length; idx++) {
          _entry = stack[idx].entry
          // bump 'enter' pos
          _entry.pos = pos
          stack[idx].context = this._enter(_entry, stack[idx-1].context)
        }
      }
    }

    // Finally append a trailing text node
    var trailingText = text.substring(pos)
    if (trailingText) {
      this._createText(rootContext, trailingText)
    }
  }

}

Fragmenter.SHOULD_NOT_SPLIT = 0
Fragmenter.NORMAL = 10
Fragmenter.ANY = 100
Fragmenter.ALWAYS_ON_TOP = Number.MAX_VALUE

// This is a sweep algorithm wich uses a set of ENTER/EXIT entries
// to manage a stack of active elements.
// Whenever a new element is entered it will be appended to its parent element.
// The stack is ordered by the annotation types.
//
// Examples:
//
// - simple case:
//
//       [top] -> ENTER(idea1) -> [top, idea1]
//
//   Creates a new 'idea' element and appends it to 'top'
//
// - stacked ENTER:
//
//       [top, idea1] -> ENTER(bold1) -> [top, idea1, bold1]
//
//   Creates a new 'bold' element and appends it to 'idea1'
//
// - simple EXIT:
//
//       [top, idea1] -> EXIT(idea1) -> [top]
//
//   Removes 'idea1' from stack.
//
// - reordering ENTER:
//
//       [top, bold1] -> ENTER(idea1) -> [top, idea1, bold1]
//
//   Inserts 'idea1' at 2nd position, creates a new 'bold1', and appends itself to 'top'
//
// - reordering EXIT
//
//       [top, idea1, bold1] -> EXIT(idea1)) -> [top, bold1]
//
//   Removes 'idea1' from stack and creates a new 'bold1'
//

function _extractEntries(annotations) {
  var openers = []
  var closers = []
  forEach(annotations, function(a) {
    var isAnchor = (a.isAnchor ? a.isAnchor() : false)
    // special treatment for zero-width annos such as ContainerAnnotation.Anchors
    if (isAnchor) {
      openers.push({
        mode: ANCHOR,
        pos: a.offset,
        id: a.id,
        level: Fragmenter.ALWAYS_ON_TOP,
        type: 'anchor',
        node: a,
        counter: -1,
        length: 0
      })
    } else {
      // TODO better naming, `Node.level` does not say enough
      // Better would be `Node.fragmentation = Fragmenter.SHOULD_NOT_SPLIT;`
      // meaning, that the fragmenter should try to render the fragment as one single
      // element, and not splitting it up on different stack levels.
      // E.g. When bold an link are overlapping
      // the fragmenter should not split the link element such as A<b>B<a>CD</a></b><a>EF</a>GH
      // but should instead A<b>B</b><a><b>CD</b><a>EF</a>GH

      // use a weak default level when not given
      var l = Fragmenter.NORMAL
      var isInline = (a.isInline ? a.isInline() : false)
      if (isInline) {
        l = Number.MAX_VALUE
      } else if (a.constructor.hasOwnProperty('fragmentation')) {
        l = a.constructor.fragmentation
      } else if (a.hasOwnProperty('fragmentationHint')) {
        l = a.fragmentationHint
      }
      var startOffset = Math.min(a.start.offset, a.end.offset)
      var endOffset = Math.max(a.start.offset, a.end.offset)
      var opener = {
        pos: startOffset,
        mode: ENTER,
        level: l,
        id: a.id,
        type: a.type,
        node: a,
        length: 0,
        counter: -1,
      }
      openers.push(opener)
      closers.push({
        pos: endOffset,
        mode: EXIT,
        level: l,
        id: a.id,
        type: a.type,
        node: a,
        opener: opener
      })
    }
  })

  // sort the openers
  openers.sort(_compareOpeners)
  // store indexes for openers
  for (var i = openers.length - 1; i >= 0; i--) {
    openers[i].idx = i
  }
  closers.sort(_compareClosers)
  // merge openers and closers, sorted by pos
  var entries = new Array(openers.length+closers.length)
  var idx = 0
  var idx1 = 0
  var idx2 = 0
  var opener = openers[idx1]
  var closer = closers[idx2]
  while(opener || closer) {
    if (opener && closer) {
      // close before open
      if (closer.pos <= opener.pos && closer.opener !== opener) {
        entries[idx] = closer
        idx2++
      } else {
        entries[idx] = opener
        idx1++
      }
    } else if (opener) {
      entries[idx] = opener
      idx1++
    } else if (closer) {
      entries[idx] = closer
      idx2++
    }
    opener = openers[idx1]
    closer = closers[idx2]
    idx++
  }
  return entries
}

function _compareOpeners(a, b) {
  if (a.pos < b.pos) return -1
  if (a.pos > b.pos) return 1
  if (a.mode < b.mode) return -1
  if (a.mode > b.mode) return 1
  if (a.mode === b.mode) {
    if (a.level < b.level) return -1
    if (a.level > b.level) return 1
  }
  return 0
}

// sort in inverse order of openers
function _compareClosers(a, b) {
  if (a.pos < b.pos) return -1
  if (a.pos > b.pos) return 1
  // this makes closer be sorted in inverse order of openers
  // to reduce stack sice
  // HACK: a bit trial error. When we have to collapsed annotations
  // at the same position then we want the closers in the same order
  // as the openers.
  if (a.pos === a.opener.pos && b.pos === b.opener.pos) {
    if (a.opener.idx < b.opener.idx) {
      return -1
    } else {
      return 1
    }
  }
  if (a.opener.idx > b.opener.idx) return -1
  if (a.opener.idx < b.opener.idx) return 1
  return 0
}

export default Fragmenter
