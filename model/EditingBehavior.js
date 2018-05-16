class EditingBehavior {
  constructor () {
    this._merge = {}
    this._mergeComponents = {}
    this._break = {}
  }

  defineMerge (firstType, secondType, impl) {
    if (!this._merge[firstType]) {
      this._merge[firstType] = {}
    }
    this._merge[firstType][secondType] = impl
    return this
  }

  canMerge (firstType, secondType) {
    return (this._merge[firstType] && this._merge[firstType][secondType])
  }

  getMerger (firstType, secondType) {
    return this._merge[firstType][secondType]
  }

  defineComponentMerge (nodeType, impl) {
    this._mergeComponents[nodeType] = impl
  }

  canMergeComponents (nodeType) {
    return this._mergeComponents[nodeType]
  }

  getComponentMerger (nodeType) {
    return this._mergeComponents[nodeType]
  }

  defineBreak (nodeType, impl) {
    this._break[nodeType] = impl
    return this
  }

  canBreak (nodeType) {
    return this._break[nodeType]
  }

  getBreaker (nodeType) {
    return this._break[nodeType]
  }
}

export default EditingBehavior
