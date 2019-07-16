import isString from '../util/isString'

const OPEN = 1
const CLOSE = -1
const ANCHOR = -2

export default class Fragmenter {
  onText (context, text, fragment) {}

  onOpen (fragment, parentContext) { return {} }

  onClose (fragment, context, parentContext) {}

  start (rootContext, text, annotations) {
    if (!isString(text)) {
      throw new Error("Illegal argument: 'text' must be a String, but was " + text)
    }
    let state = this._init(rootContext, text, annotations)
    let B = state.boundaries
    let S = state.stack
    let TOP = () => S[S.length - 1]
    let currentPos = 0
    let __runs = 0
    let MAX_RUNS = B.length * 2
    while (B.length > 0) {
      __runs++
      if (__runs > MAX_RUNS) throw new Error('FIXME: infinity loop in Fragmenter implementation')
      let b = B.shift()
      let topContext = TOP().context
      if (b.offset > currentPos) {
        let textFragment = text.slice(currentPos, b.offset)
        this.onText(topContext, textFragment)
        currentPos = b.offset
      }
      switch (b.type) {
        case ANCHOR: {
          let parentContext = topContext
          let anchorContext = this.onOpen(b, parentContext)
          this._close(b, anchorContext, parentContext)
          break
        }
        case CLOSE: {
          // ATTENTION: we have to make sure that closers are sorted correctly
          let { context, entry } = TOP()
          if (entry.node !== b.node) {
            B.unshift(b)
            this._fixOrderOfClosers(S, B, 0)
            // restart this iteration
            continue
          }
          S.pop()
          let parentContext = TOP().context
          this._close(b, context, parentContext)
          break
        }
        case OPEN: {
          let a = TOP().entry
          if (!a || a.endOffset >= b.endOffset) {
            b.stackLevel = S.length
            let context = this.onOpen(b, topContext)
            S.push({ context, entry: b })
          } else {
            // splitting annotation b
            if (b.weight <= a.weight) {
              b.stackLevel = S.length
              // new closer at the splitting pos
              let closer = {
                type: CLOSE,
                offset: a.endOffset,
                node: b.node,
                opener: b
              }
              // and re-opening with fragment counter increased
              let opener = {
                type: OPEN,
                offset: a.endOffset,
                node: b.node,
                fragmentCount: b.fragmentCount + 1,
                endOffset: b.endOffset,
                weight: b.weight,
                // attaching the original closer
                closer: b.closer
              }
              // and vice-versa
              b.closer.opener = opener
              // and fixing b for sake of consistency
              b.closer = closer
              b.endOffset = a.endOffset
              this._insertBoundary(B, closer)
              this._insertBoundary(B, opener)
              let context = this.onOpen(b, topContext)
              S.push({ context, entry: b })
            // splitting annotation a
            } else {
              // In this case we put boundary back
              // and instead insert boundaries splitting annotation a
              B.unshift(b)
              // new closer at the splitting pos
              let closer = {
                type: CLOSE,
                offset: b.offset,
                node: a.node,
                opener: a
              }
              // and re-opening with fragment counter increased
              let opener = {
                type: OPEN,
                offset: b.offset,
                node: a.node,
                fragmentCount: a.fragmentCount + 1,
                endOffset: a.endOffset,
                weight: a.weight,
                // attaching the original closer
                closer: a.closer
              }
              // .. and vice-versa
              a.closer.opener = opener
              // and fixing b for sake of consistency
              a.closer = closer
              a.endOffset = b.offset
              this._insertBoundary(B, closer)
              this._insertBoundary(B, opener)
              continue
            }
          }
          break
        }
        default:
          //
      }
    }
    // Finally append a trailing text node
    let trailingText = text.substring(currentPos)
    if (trailingText) {
      this.onText(rootContext, trailingText)
    }
  }

  _init (rootContext, text, annotations) {
    let boundaries = []
    annotations.forEach(a => {
      if (a.isAnchor() || a.start.offset === a.end.offset) {
        boundaries.push({
          type: ANCHOR,
          offset: a.start.offset,
          endOffset: a.start.offset,
          length: 0,
          node: a
        })
      } else {
        let opener = {
          type: OPEN,
          offset: a.start.offset,
          node: a,
          fragmentCount: 0,
          endOffset: a.end.offset,
          weight: a._getFragmentWeight()
        }
        let closer = {
          type: CLOSE,
          offset: a.end.offset,
          node: a,
          opener
        }
        opener.closer = closer
        boundaries.push(opener)
        boundaries.push(closer)
      }
    })
    boundaries.sort(this._compareBoundaries.bind(this))
    let state = {
      stack: [{context: rootContext, entry: null}],
      boundaries
    }
    return state
  }

  _close (fragment, context, parentContext) {
    if (fragment.type === CLOSE) {
      fragment = fragment.opener
      fragment.length = fragment.endOffset - fragment.offset
    }
    this.onClose(fragment, context, parentContext)
  }

  _compareBoundaries (a, b) {
    if (a.offset < b.offset) return -1
    if (a.offset > b.offset) return 1
    if (a.type < b.type) return -1
    if (a.type > b.type) return 1
    if (a.type === OPEN) {
      if (a.endOffset > b.endOffset) return -1
      if (a.endOffset < b.endOffset) return 1
      if (a.weight > b.weight) return -1
      if (a.weight < b.weight) return 1
      if (a.stackLevel && b.stackLevel) {
        return a.stackLevel - b.stackLevel
      }
      return 0
    } else if (a.type === CLOSE) {
      return -this._compareBoundaries(a.opener, b.opener)
    } else {
      return 0
    }
  }

  _insertBoundary (B, b, startIndex = 0) {
    for (let idx = startIndex, l = B.length; idx < l; idx++) {
      if (this._compareBoundaries(b, B[idx]) === -1) {
        B.splice(idx, 0, b)
        return idx
      }
    }
    // if not inserted before, append
    B.push(b)
    return B.length - 1
  }

  // Note: due to fragmentation of overlapping nodes, the original
  // order of closers might become invalid
  _fixOrderOfClosers (S, B, startIndex) {
    let activeOpeners = {}
    let first = B[startIndex]
    let closers = [first]
    for (let idx = startIndex + 1, l = B.length; idx < l; idx++) {
      let b = B[startIndex + idx]
      if (b.type !== CLOSE || b.offset !== first.offset) break
      closers.push(b)
    }
    for (let idx = S.length - 1; idx >= 1; idx--) {
      let opener = S[idx].entry
      activeOpeners[opener.node.id] = opener
    }
    for (let idx = 0, l = closers.length; idx < l; idx++) {
      let closer = closers[idx]
      let opener = activeOpeners[closer.node.id]
      if (!opener) {
        throw new Error('Fragmenter Error: there is no opener for closer')
      }
      closer.opener = opener
    }
    closers.sort(this._compareBoundaries.bind(this))

    const _checkClosers = () => {
      for (let idx = 0; idx < closers.length; idx++) {
        if (S[S.length - 1 - idx].entry.node !== closers[idx].node) return false
      }
      return true
    }
    console.assert(_checkClosers(), 'Fragmenter: closers should be alligned with the current stack of elements')

    B.splice(startIndex, closers.length, ...closers)
  }
}

// Fragment weight values that are used to influence how fragments
// get stacked when they are overlapping
Fragmenter.MUST_NOT_SPLIT = Number.MAX_VALUE
Fragmenter.SHOULD_NOT_SPLIT = 1000
Fragmenter.NORMAL = 100
Fragmenter.ALWAYS_ON_TOP = 0
