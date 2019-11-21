import { test } from 'substance-test'
import { Fragmenter, PropertyAnnotation, _isDefined } from 'substance'

const TEXT = 'ABCDEFGHI'

test('Fragmenter: No annos.', function (t) {
  const annos = []
  const html = _render(TEXT, annos)
  t.equal(html, TEXT)
  t.end()
})

test('Fragmenter: With one anno.', function (t) {
  const annos = [new Anno('b', 'b1', 3, 6)]
  const html = _render(TEXT, annos)
  t.equal(html, 'ABC<b>DEF</b>GHI')
  t.end()
})

test('Fragmenter: With one anchor.', function (t) {
  const annos = [new Anno('a', 'a1', 3, 3, {
    isAnchor: true
  })]
  const html = _render(TEXT, annos)
  t.equal(html, 'ABC<a></a>DEFGHI')
  t.end()
})

test('Fragmenter: With one inline.', function (t) {
  const annos = [new Anno('i', 'i1', 3, 4)]
  const html = _render(TEXT, annos)
  t.equal(html, 'ABC<i>D</i>EFGHI')
  t.end()
})

test('Fragmenter: One nested anno.', function (t) {
  const annos = [new Anno('b', 'b1', 3, 6), new Anno('i', 'i1', 4, 5)]
  const html = _render(TEXT, annos)
  t.equal(html, 'ABC<b>D<i>E</i>F</b>GHI')
  t.end()
})

test('Fragmenter: Overlapping annos.', function (t) {
  const annos = [new Anno('b', 'b1', 3, 6), new Anno('i', 'i1', 4, 8)]
  const html = _render(TEXT, annos)
  t.equal(html, 'ABC<b>D<i>EF</i></b><i>GH</i>I')
  t.end()
})

test('Fragmenter: Equal annos.', function (t) {
  const annos = [new Anno('b', 'b1', 3, 6), new Anno('i', 'i1', 3, 6)]
  const html = _render(TEXT, annos)
  t.equal(html, 'ABC<b><i>DEF</i></b>GHI')
  t.end()
})

test('Fragmenter: Overlapping with fragment weight.', function (t) {
  let annos = [
    // typically one would specify a higher weight for nodes such as link
    // in contrast to annotation nodes, such as bold or itallic,
    // so that the link is renedered as a single element and not split apart
    new Anno('bold', 'b1', 3, 6),
    new Anno('link', 'link1', 4, 8, {
      getFragmentWeight () { return Fragmenter.SHOULD_NOT_SPLIT }
    })
  ]
  let html = _render(TEXT, annos)
  t.equal(html, 'ABC<bold>D</bold><link><bold>EF</bold>GH</link>I')

  // on the other hand, the link is fine inside a bold, i.e. no need to split this bold
  annos = [
    new Anno('bold', 'b1', 2, 8),
    new Anno('link', 'link1', 3, 7, {
      getFragmentWeight () { return Fragmenter.SHOULD_NOT_SPLIT }
    })
  ]
  html = _render(TEXT, annos)
  t.equal(html, 'AB<bold>C<link>DEFG</link>H</bold>I')

  t.end()
})

test('Fragmenter: Anchors should rendered as early as possible.', function (t) {
  const annos = [
    new Anno('b', 'b1', 3, 6),
    new Anno('a', 'a1', 3, 3, {
      isAnchor: true
    })
  ]
  const html = _render(TEXT, annos)
  t.equal(html, 'ABC<a></a><b>DEF</b>GHI')
  t.end()
})

test('Fragmenter: Two subsequent inline nodes.', function (t) {
  const annos = [
    new Anno('a', 'inline1', 3, 4, {
      isInline: true
    }),
    new Anno('b', 'inline2', 4, 5, {
      isInline: true
    })
  ]
  const html = _render(TEXT, annos)
  t.equal(html, 'ABC<a>D</a><b>E</b>FGHI')
  t.end()
})

test('Fragmenter: Collapsed annotation.', function (t) {
  const annos = [
    new Anno('a', 'a1', 0, 0, {
    })
  ]
  const html = _render(TEXT, annos)
  t.equal(html, '<a></a>ABCDEFGHI')
  t.end()
})

test('Fragmenter: Two collapsed annotations.', function (t) {
  const annos = [
    new Anno('a', 'a1', 0, 0, {
    }),
    new Anno('b', 'b2', 0, 0, {
    })
  ]
  const html = _render(TEXT, annos)
  t.equal(html, '<a></a><b></b>ABCDEFGHI')
  t.end()
})

test('Fragmenter: Anchors should not fragment other annotations.', function (t) {
  const annos = [
    new Anno('a', 'a1', 3, 6),
    new Anno('b', 'b1', 4, 4, {
      isAnchor: true
    })
  ]
  const html = _render(TEXT, annos)
  t.equal(html, 'ABC<a>D<b></b>EF</a>GHI')
  t.end()
})

class Anno extends PropertyAnnotation {
  constructor (tagName, id, startOffset, endOffset, opts) {
    super(null, {
      id: id,
      start: { path: [id, 'content'], offset: startOffset },
      end: { path: [id, 'content'], offset: endOffset }
    })

    opts = opts || {}
    this.tagName = tagName

    this._isAnchor = false
    this._isInline = false

    if (opts.getFragmentWeight) {
      this.getFragmentWeight = opts.getFragmentWeight
    }

    if (_isDefined(opts.isAnchor)) {
      this._isAnchor = opts.isAnchor
      this.zeroWidth = true
      this.offset = startOffset
    }

    if (_isDefined(opts.isInline)) {
      this._isInline = opts.isInline
    }
  }

  // anchors are special annotations that have zero width
  isAnchor () {
    return this._isAnchor
  }

  // inline nodes are implementated as annotations bound to a single character
  // I.e. the always have a length of 1
  isInline () {
    return this._isInline
  }
}

function _render (text, annotations, opts) {
  opts = opts || {}
  const output = []
  const fragmenter = new Fragmenter()
  fragmenter.onText = function (context, text) {
    output.push(text)
  }
  fragmenter.onOpen = function (fragment) {
    const node = fragment.node
    if (opts.withId) {
      output.push('<' + node.tagName + ' id="' + node.id + '">')
    } else {
      output.push('<' + node.tagName + '>')
    }
  }
  fragmenter.onClose = function (fragment) {
    const node = fragment.node
    output.push('</' + node.tagName + '>')
  }
  fragmenter.start(output, text, annotations)
  return output.join('')
}
