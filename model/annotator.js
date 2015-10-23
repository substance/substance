"use strict";

var _ = require('../util/helpers');
var OO = require('../util/oo');

var ENTER = 1;
var EXIT = -1;
// Markers are put before other opening tags
var ENTER_EXIT = -2;

// Annotator
// --------
//
// An algorithm that is used to fragment overlapping structure elements
// following a priority rule set.
// E.g., we use this for creating DOM elements for annotations. The annotations
// can partially be overlapping. However this is not allowed in general for DOM elements
// or other hierarchical structures.
//
// Example: For the Annotation use casec consider a 'comment' spanning partially
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

var Annotator = function(options) {
  _.extend(this, options);
};

Annotator.Prototype = function() {

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

  // Orders sweep events according to following precedences:
  //
  // 1. pos
  // 2. EXIT < ENTER
  // 3. if both ENTER: ascending level
  // 4. if both EXIT: descending level

  var _compare = function(a, b) {
    if (a.pos < b.pos) return -1;
    if (a.pos > b.pos) return 1;

    if (a.id === b.id) {
      return b.mode - a.mode;
    }

    if (a.mode < b.mode) return -1;
    if (a.mode > b.mode) return 1;

    if (a.mode === ENTER) {
      if (a.level < b.level) return -1;
      if (a.level > b.level) return 1;
    }

    if (a.mode === EXIT) {
      if (a.level > b.level) return -1;
      if (a.level < b.level) return 1;
    }

    return 0;
  };

  var extractEntries = function(annotations) {
    var entries = [];
    _.each(annotations, function(a) {
      // special treatment for zero-width annos such as ContainerAnnotation.Anchors
      if (a.zeroWidth) {
        entries.push({ pos: a.offset, mode: ENTER_EXIT, id: a.id, level: Number.MAX_VALUE, type: 'anchor', node: a });
      } else {
        // use a weak default level when not given
        var l = 1000;
        if (a.constructor.static && a.constructor.static.level) {
          l = a.constructor.static.level;
        }
        entries.push({ pos : a.startOffset, mode: ENTER, level: l, id: a.id, type: a.type, node: a });
        entries.push({ pos : a.endOffset, mode: EXIT, level: l, id: a.id, type: a.type, node: a });
      }
    });
    return entries;
  };

  this.onText = function(/*context, text*/) {};

  // should return the created user context
  this.onEnter = function(/*entry, parentContext*/) {
    return null;
  };

  this.onExit = function(/*entry, context, parentContext*/) {};

  this.enter = function(entry, parentContext) {
    return this.onEnter(entry, parentContext);
  };

  this.exit = function(entry, context, parentContext) {
    this.onExit(entry, context, parentContext);
  };

  this.createText = function(context, text) {
    if (text.length > 0) {
      this.onText(context, text);
    }
  };

  this.start = function(rootContext, text, annotations) {
    var self = this;

    var entries = extractEntries.call(this, annotations);
    entries.sort(_compare.bind(this));
    var stack = [{context: rootContext, entry: null}];
    var pos = 0;

    for (var i = 0; i < entries.length; i++) {
      var entry = entries[i];
      // in any case we add the last text to the current element
      this.createText(stack[stack.length-1].context, text.substring(pos, entry.pos));

      pos = entry.pos;
      var stackLevel, idx;
      if (entry.mode === ENTER || entry.mode === ENTER_EXIT) {
        // find the correct position and insert an entry
        for (stackLevel = 1; stackLevel < stack.length; stackLevel++) {
          if (entry.level < stack[stackLevel].entry.level) {
            break;
          }
        }
        // create elements which are open, and are now stacked ontop of the
        // entered entry
        for (idx = stack.length-1; idx >= stackLevel; idx--) {
          this.exit(stack[idx].entry, stack[idx].context, stack[idx-1].context);
        }
        stack.splice(stackLevel, 0, {entry: entry});
        // create new elements for all lower entries
        for (idx = stackLevel; idx < stack.length; idx++) {
          stack[idx].context = self.enter(stack[idx].entry, stack[idx-1].context);
        }
      }
      if (entry.mode === EXIT || entry.mode === ENTER_EXIT) {
        // find the according entry and remove it from the stack
        for (stackLevel = 1; stackLevel < stack.length; stackLevel++) {
          if (stack[stackLevel].entry.node === entry.node) {
            break;
          }
        }
        for (idx = stack.length-1; idx >= stackLevel; idx--) {
          this.exit(stack[idx].entry, stack[idx].context, stack[idx-1].context);
        }
        stack.splice(stackLevel, 1);
        // create new elements for all lower entries
        for (idx = stackLevel; idx < stack.length; idx++) {
          stack[idx].context = self.enter(stack[idx].entry, stack[idx-1].context);
        }
      }
    }

    // Finally append a trailing text node
    this.createText(rootContext, text.substring(pos));
  };

};

OO.initClass( Annotator );

module.exports = Annotator;
