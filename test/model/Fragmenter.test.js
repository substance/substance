'use strict';

var test = require('../test').module('model/Fragmenter');

var oo = require('../../util/oo');
var Fragmenter = require('../../model/Fragmenter');
// var DOMElement = require('../../ui/DOMElement');

// - nodes with lower level should be split less often
// - inline nodes must not be split at all
// - anchor nodes must never be split at all and should always be nested on the deepest
//   level
// - annotations with the same extension should be stacked

var TEXT = 'ABCDEFGHI';

function Anno(tagName, id, startOffset, endOffset, opts) {
  opts = opts || {};
  this.tagName = tagName;
  this.id = id;
  this.offset = startOffset;
  this.startOffset = startOffset;
  this.endOffset = endOffset;

  this._isAnchor = false;
  this._isInline = false;

  if (opts.anchor) {
    this.zeroWidth = true;
    this.offset = this.startOffset;
  }

  if (opts.hasOwnProperty('fragmentation')) {
    this.fragmentationHint = opts.fragmentation;
  }

  if (opts.hasOwnProperty('isAnchor')) {
    this._isAnchor = opts.isAnchor;
  }

  if (opts.hasOwnProperty('isInline')) {
    this._isInline = opts.isInline;
  }
}

Anno.Prototype = function() {

  // anchors are special annotations that have zero width
  this.isAnchor = function() {
    return this._isAnchor;
  };

  // inline nodes are implementated as annotations bound to a single character
  // I.e. the always have a length of 1
  this.isInline = function() {
    return this._isInline;
  };

};

oo.initClass(Anno);

var _render = function(text, annotations, opts) {
  opts = opts || {};
  var output = [];
  var fragmenter = new Fragmenter();
  fragmenter.onText = function(context, text) {
    output.push(text);
  };
  fragmenter.onEnter = function(fragment) {
    var node = fragment.node;
    if (opts.withId) {
      output.push('<' + node.tagName + ' id="' + node.id +'">');
    } else {
      output.push('<' + node.tagName + '>');
    }
  };
  fragmenter.onExit = function(fragment) {
    var node = fragment.node;
    output.push('</' + node.tagName + '>');
  };
  fragmenter.start(output, text, annotations);
  return output.join('');
};

// var _wrapped = function(html) {
//   return '<div>' + html + '</div>';
// };

test("No annos.", function(t) {
  var annos = [];
  var html = _render(TEXT, annos);
  t.equal(html, TEXT);
  t.end();
});

test("With one anno.", function(t) {
  var annos = [new Anno('b', 'b1', 3, 6)];
  var html = _render(TEXT, annos);
  t.equal(html, 'ABC<b>DEF</b>GHI');
  t.end();
});

test("With one anchor.", function(t) {
  var annos = [new Anno('a', 'a1', 3, 3, {
    isAnchor: true
  })];
  var html = _render(TEXT, annos);
  t.equal(html, 'ABC<a></a>DEFGHI');
  t.end();
});

test("With one inline.", function(t) {
  var annos = [new Anno('i', 'i1', 3, 4)];
  var html = _render(TEXT, annos);
  t.equal(html, 'ABC<i>D</i>EFGHI');
  t.end();
});

test("One nested anno.", function(t) {
  var annos = [new Anno('b', 'b1', 3, 6), new Anno('i', 'i1', 4, 5)];
  var html = _render(TEXT, annos);
  t.equal(html, 'ABC<b>D<i>E</i>F</b>GHI');
  t.end();
});

test("Overlapping annos.", function(t) {
  var annos = [new Anno('b', 'b1', 3, 6), new Anno('i', 'i1', 4, 8)];
  var html = _render(TEXT, annos);
  t.equal(html, 'ABC<b>D<i>EF</i></b><i>GH</i>I');
  t.end();
});

test("Equal annos.", function(t) {
  var annos = [new Anno('b', 'b1', 3, 6), new Anno('i', 'i1', 3, 6)];
  var html = _render(TEXT, annos);
  t.equal(html, 'ABC<b><i>DEF</i></b>GHI');
  t.end();
});

test("Overlapping with fragmentation hint.", function(t) {
  var annos = [
    new Anno('b', 'b1', 3, 6),
    new Anno('a', 'link1', 4, 8, {
      fragmentation: Fragmenter.SHOULD_NOT_SPLIT
    })
  ];
  var html = _render(TEXT, annos);
  t.equal(html, 'ABC<b>D</b><a><b>EF</b>GH</a>I');
  t.end();
});

test("Anchors should rendered as early as possible.", function(t) {
  var annos = [
    new Anno('b', 'b1', 3, 6),
    new Anno('a', 'a1', 3, 3, {
      isAnchor: true
    })
  ];
  var html = _render(TEXT, annos);
  t.equal(html, 'ABC<a></a><b>DEF</b>GHI');
  t.end();
});


test("Two subsequent inline nodes.", function(t) {
  var annos = [
    new Anno('a', 'inline1', 3, 4, {
      isInline: true
    }),
    new Anno('b', 'inline2', 4, 5, {
      isInline: true
    })
  ];
  var html = _render(TEXT, annos);
  t.equal(html, 'ABC<a>D</a><b>E</b>FGHI');
  t.end();
});

test("Collapsed annotation.", function(t) {
  var annos = [
    new Anno('a', 'a1', 0, 0, {
    })
  ];
  var html = _render(TEXT, annos);
  t.equal(html, '<a></a>ABCDEFGHI');
  t.end();
});

test("Two collapsed annotations.", function(t) {
  var annos = [
    new Anno('a', 'a1', 0, 0, {
    }),
    new Anno('b', 'b2', 0, 0, {
    })
  ];
  var html = _render(TEXT, annos);
  t.equal(html, '<a></a><b></b>ABCDEFGHI');
  t.end();
});

test("Anchors should not fragment other annotations.", function(t) {
  var annos = [
    new Anno('a', 'a1', 3, 6),
    new Anno('b', 'b1', 4, 4, {
      isAnchor: true
    })
  ];
  var html = _render(TEXT, annos);
  t.equal(html, 'ABC<a>D<b></b>EF</a>GHI');
  t.end();
});
