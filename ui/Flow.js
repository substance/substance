import isPlainObject from 'lodash/isPlainObject'
import deleteFromArray from '../util/deleteFromArray'
import map from '../util/map'
import uuid from '../util/uuid'

class Flow {

  constructor(stages) {
    this.id = uuid()
    this.stages = stages.slice(0)

    this.sources = {}
    // for batch unsubscription
    this._subscriptionsByOwner = {}
    // for dependency propagation
    this._subscriptionsByResource = {}

    // temporary state
    this._isFlowing = false
    this._schedule = {}
    this._scheduled = {}
    this._data = {}
  }

  dispose() {
    const sources = this.sources
    map(sources, function(source) { source.dispose() })
    this.sources = {}
    this._subscriptionsByOwner = {}
    this._subscriptionsByResource = {}
  }

  /*
    Trying to simplify the API later, or maybe we leave it like that, so it feels substantially different to the EventEmitter API

    Requirements:

    - stage: so that the handler gets called at the right time

      > alternatively we could derive the stage from the sources.
      > still this would give an easy way of controlling calling order of hooks

    - resources: a single or an array of (source, resourceId) tuples, such as `(doc, ['text1', 'content'])`.
               multiple sources are necessary, to avoid unnecessary rerenderings:
               e.g. a TextProperty needs to rerender, when text changes, or markers, or selection

    - handler: a function which will be called with the updated values described by sources

    - owner: so that we can collect subscriptions per owner, and offer a batch unsubscribe option.
             alternatively, we drop the batch unsubscribe and use the provided function directly. User would need to bind manually
  */
  subscribe(subscription) {
    subscription = this._compileSubscription(subscription)
    const byResource = this._subscriptionsByResource
    const byOwner = this._subscriptionsByOwner
    const owner = subscription.owner
    if (!owner[this.id]) owner[this.id] = uuid()
    const ownerId = owner[this.id]
    subscription.resourceIds.forEach(function(resourceId) {
      if(!byResource[resourceId]) byResource[resourceId] = []
      byResource[resourceId].push(subscription)
    })
    if (!byOwner[ownerId]) byOwner[ownerId] = []
    byOwner[ownerId].push(subscription)
  }

  unsubscribe(owner) {
    const ownerId = owner[this.id]
    const byOwner = this._subscriptionsByOwner
    const subscriptions = byOwner[ownerId]
    if (subscriptions) {
      subscriptions.forEach((s) => { this._unsubscribe(s) })
    }
    delete byOwner[ownerId]
    // also remove the stamp
    delete owner[this.id]
  }

  _unsubscribe(subscription) {
    const byResource = this._subscriptionsByResource
    subscription.resourceIds.forEach(function(resourceId) {
      const subscriptions = byResource[resourceId]
      if (subscriptions) {
        deleteFromArray(byResource[resourceId], subscription)
        if (subscriptions.length === 0) delete byResource[resourceId]
      }
    })
  }

  _compileSubscription(subscription) {
    const _id = this.id
    const sources = this.sources
    ;['stage', 'resources', 'handler', 'owner'].forEach(function(prop) {
      if (!subscription[prop]) throw new Error("'"+prop+"' is required")
    })
    const resourceIds = subscription.resources.map(function(r) {
      if (!r.source) throw new Error("'source' is required")
      const source = sources[r.source[_id]]
      if (!source) throw new Error("source is not registered in this flow")
      return [source.id].concat(r.path)
    })
    return {
      stage: subscription.stage,
      resourceIds: resourceIds,
      handler: subscription.handler.bind(subscription.owner),
      owner: subscription.owner,
    }
  }

  addSource(flowSource) {
    this.sources.push(flowSource)
  }

  _getId(obj) {
    const _id = this.id
    if (!obj[_id]) obj[_id] = uuid()
    return obj[_id]
  }

  _set(resourceId, data) {
    if (!this._subscriptionsByResource[resourceId]) return
    // you should use a simple flat object for resource data
    this._data[resourceId] = data
    this._propagate(resourceId)
  }

  _extend(resourceId, data) {
    if (!this._subscriptionsByResource[resourceId]) return
    if (!isPlainObject(data)) throw new Error('Flow.extend() should only be used with plain objects')
    let _data = this._data[resourceId]
    if (!_data) {
      this._data[resourceId] = _data = {}
    }
    Object.assign(_data, data)
    this._propagate(resourceId)
  }

  _extendInfo(info) {
    Object.assign(this._info, info)
  }

  _propagate(resourceId) {
    const subscriptions = this._subscriptionsByResource[resourceId]
    if (!this._isFlowing) this._reset()
    subscriptions.forEach((s) => {
      if (this._scheduled[s.id]) return
      this._scheduled[s.id] = true
      this._schedule[s.stage].push(s)
    })
    if (!this._isFlowing) {
      this._isFlowing = true
      try {
        this._runSchedule()
      } finally {
        this._isFlowing = false
      }
    }
  }

  _reset() {
    const schedule = {}
    this.stages.forEach(function(name) {
      schedule[name] = []
    })
    this._info = {}
    this._schedule = schedule
    this._scheduled = {}
  }

  _runSchedule() {
    this.stages.forEach((name) => {
      const stage = this._schedule[name]
      if (!stage) throw new Error('Internal error')
      while (stage.length > 0) {
        const next = stage.shift()
        const data = next.resourceIds.map((id) => {
          return this._data[id]
        })
        next.handler(data, ...data, this._info)
      }
    })
  }
}

export default Flow
