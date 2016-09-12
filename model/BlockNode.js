'use strict';

import DocumentNode from './DocumentNode'

function BlockNode() {
  BlockNode.super.apply(this, arguments);
}

DocumentNode.extend(BlockNode);

BlockNode.isBlock = true;

export default BlockNode;
