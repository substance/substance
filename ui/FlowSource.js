import uuid from '../util/uuid'

class FlowSource {

  constructor(flow, source) {
    this.id = uuid()
    this[flow.id] = this.id

    if (source[flow.id]) throw new Error('source is already registered')
    source[flow.id] = this.id

    this.flow = flow
    this.source = source
    flow.sources[this.id] = this
  }

  dispose() {
    delete this.flow.sources[this.id]
    delete this.source[this.flow.id]
  }

  set(resource, data) {
    const resourceId = [this.id].concat(resource)
    this.flow._set(resourceId, data)
  }

  extend(resource, data) {
    const resourceId = [this.id].concat(resource)
    this.flow._extend(resourceId, data)
  }

  extendInfo(info) {
    this.flow._extendInfo(info)
  }

  startFlow() {
    this.flow._startFlow()
  }

}

export default FlowSource
