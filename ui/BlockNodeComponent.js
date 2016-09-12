'use strict';

import NodeComponent from './NodeComponent'

function BlockNodeComponent() {
  BlockNodeComponent.super.apply(this, arguments);
}

BlockNodeComponent.Prototype = function() {
  // maybe someday we need some BlockNode specific rendering
};

NodeComponent.extend(BlockNodeComponent);

export default BlockNodeComponent;
