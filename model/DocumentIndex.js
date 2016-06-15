'use strict';

var NodeIndex = require('./data/NodeIndex');

function DocumentIndex() {}

NodeIndex.extend(DocumentIndex);

DocumentIndex.filterByType = NodeIndex.filterByType;

module.exports = NodeIndex;
