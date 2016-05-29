'use strict';

var BlockNode = require('../../model/BlockNode');

function TableNode() {
  TableNode.super.apply(this, arguments);
}

BlockNode.extend(TableNode);

TableNode.static.name = "table";

TableNode.static.defineSchema({
  // HACK: very low-levelish schema, where the objects will be entries
  // like `{ content: 'p1'}` plus maybe some more meta such as `cellType`
  // TODO: refine when we know exactly what we need
  "cells": { type: ['array', 'array', 'object'], default: [] }
});

module.exports = TableNode;
