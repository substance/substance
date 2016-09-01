'use strict';

import PropertyAnnotation from './PropertyAnnotation'

function InlineNode() {
  InlineNode.super.apply(this, arguments);
}

PropertyAnnotation.extend(InlineNode);

InlineNode.isInline = true;

export default InlineNode;
