'use strict';

import NodeIndex from './data/NodeIndex'

function DocumentIndex() {}

NodeIndex.extend(DocumentIndex);

DocumentIndex.filterByType = NodeIndex.filterByType;

export default NodeIndex;
