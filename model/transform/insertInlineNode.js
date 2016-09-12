'use strict';

import insertText from './insertText'
import createAnnotation from './createAnnotation'

/**
  Inserts a new inline node at the given selection/cursor.

  @param {Object} args object with `selection`, `containerId` and `node` that has the node data

  @return {Object} object with updated selection

  @example

  ```js
  insertInlineNode(tx, {
    selection: bodyEditor.getSelection(),
    node: {
      type: 'citation'
    }
  });
  ```
*/

function insertInlineNode(tx, args) {
  // 1. Insert fake character the inline node will stick
  var tmp = insertText(tx, {
    selection: args.selection,
    text: "\uFEFF"
  });

  var inlineNodeSel = tx.createSelection({
    type: 'property',
    path: tmp.selection.path,
    startOffset: tmp.selection.startOffset-1,
    endOffset: tmp.selection.endOffset
  });

  // 2. Create citation annotation
  args.node = args.node;
  args.selection = inlineNodeSel;
  args = createAnnotation(tx, args);
  return args;
}

export default insertInlineNode;
