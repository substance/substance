import BlockNode from '../../model/BlockNode'

class TableNode extends BlockNode {

  getRowCount() {
    return this.cells.length
  }

  getColCount() {
    if (this.cells.length > 0) {
      return this.cells[0].length
    } else {
      return 0
    }
  }

}

TableNode.type = "table"

TableNode.define({
  // HACK: very low-levelish schema, where the objects will be entries
  // like `{ content: 'p1'}` plus maybe some more meta such as `cellType`
  // TODO: refine when we know exactly what we need
  "cells": { type: ['array', 'array', 'id'], default: [] }
})

export default TableNode
